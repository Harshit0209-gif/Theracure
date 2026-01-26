import puppeteer from "puppeteer";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { InvoicePayload, TransactionStatus } from "@/types/invoice";
import { PUPPETEER_CONFIG } from "@/config/puppeteer.config";
import os from "os";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const generateInvoicePDF = async (invoiceData: InvoicePayload) => {
  let browser;
  let tmpDir: string | null = null;

  try {
    // 1. Create a unique temporary directory
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "puppeteer-"));

    // 2. Create a dynamic launch config
    const launchConfig = {
      ...PUPPETEER_CONFIG,
      args: [
        ...PUPPETEER_CONFIG.args,
        `--user-data-dir=${tmpDir}`,
        `--crash-dumps-dir=${tmpDir}`,
        '--no-sandbox',
        '--disable-setuid-sandbox',
      ],
    };

    browser = await puppeteer.launch(launchConfig);

    const page = await browser.newPage();

    page.setDefaultTimeout(30000);

    const htmlTemplate = await generateInvoiceHTML(invoiceData);

    await page.setContent(htmlTemplate, {
      waitUntil: "networkidle0",
      timeout: 30000,
    });

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: {
        top: "0.2in",
        right: "0.2in",
        bottom: "0.2in",
        left: "0.2in",
      },
      preferCSSPageSize: true,
      timeout: 30000,
    });

    return pdfBuffer;
  } catch (error) {
    console.error("Invoice PDF generation error:", error);
    throw new Error(
      `Failed to generate invoice PDF: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
    );
  } finally {
    if (browser) {
      await browser.close();
    }
    // 4. Clean up the temporary directory
    if (tmpDir) {
      try {
        await fs.rm(tmpDir, { recursive: true, force: true });
      } catch (e) {
        console.error(`Failed to clean up temporary directory ${tmpDir}:`, e);
      }
    }
  }
};

const getImageAsBase64 = async () => {
  try {
    const alternativePaths = [
      path.resolve(process.cwd(), "public/apple-touch-icon.png"),
      path.resolve(process.cwd(), "public", "apple-touch-icon.png"),
      path.resolve(__dirname, "../../public/apple-touch-icon.png"),
    ];

    let imageBuffer;
    let foundPath = null;

    // Try all alternative paths
    for (const altPath of alternativePaths) {
      try {
        imageBuffer = await fs.readFile(altPath);
        foundPath = altPath;
        break;
      } catch (altError) {
        continue;
      }
    }

    if (!imageBuffer) {
      console.warn(
        "Logo image not found at any of the expected paths:",
        alternativePaths,
      );
      return null;
    }

    console.log("Logo image found at:", foundPath);

    const base64String = imageBuffer.toString("base64");

    const ext = foundPath ? path.extname(foundPath).toLowerCase() : "";
    let mimeType = "image/png";

    switch (ext) {
      case ".jpg":
      case ".jpeg":
        mimeType = "image/jpeg";
        break;
      case ".png":
        mimeType = "image/png";
        break;
      case ".svg":
        mimeType = "image/svg+xml";
        break;
      case ".gif":
        mimeType = "image/gif";
        break;
    }

    return `data:${mimeType};base64,${base64String}`;
  } catch (error) {
    console.error("Error reading logo image:", error);
    return null;
  }
};

const calculateTotalPaid = (transactions?: any[]) => {
  if (!transactions || transactions.length === 0) return 0;
  return parseFloat(
    transactions
      .filter((t) => t.status === TransactionStatus.SUCCESS)
      .reduce((sum, t) => {
        const transactionAmount = parseFloat(t.amount.toFixed(2));
        return sum + transactionAmount;
      }, 0)
      .toFixed(2),
  );
};

const getPaymentMethods = (transactions?: any[]) => {
  if (!transactions || transactions.length === 0) return "N/A";
  const methods = transactions
    .filter((t) => t.status === TransactionStatus.SUCCESS && t.paymentMethod)
    .map((t) => t.paymentMethod)
    .filter((method, index, self) => self.indexOf(method) === index);
  return methods.length > 0 ? methods.join(", ") : "N/A";
};

// Helper function to format transaction date
const getLatestTransactionDate = (transactions?: any[]) => {
  if (!transactions || transactions.length === 0) return null;
  const successfulTransactions = transactions.filter(
    (t) => t.status === TransactionStatus.SUCCESS,
  );
  if (successfulTransactions.length === 0) return null;
  const latest = successfulTransactions.sort(
    (a, b) =>
      new Date(b.transactionDate).getTime() -
      new Date(a.transactionDate).getTime(),
  )[0];
  return latest.transactionDate;
};

// HTML Template Generator Function (now async)
const generateInvoiceHTML = async (data: InvoicePayload) => {
  const { patientInfo, invoiceDetails, paymentDetails, selectedServices } =
    data;
  console.log("Generating invoice HTML with data:", data);

  // Calculate amount paid from transactions
  const amountPaidFromTransactions = calculateTotalPaid(
    invoiceDetails.transactions,
  );
  let paymentMethods = getPaymentMethods(invoiceDetails.transactions);
  if (paymentMethods === "N/A") {
    paymentMethods = invoiceDetails.paymentMethod || "N/A";
  }
  const latestPaymentDate = getLatestTransactionDate(
    invoiceDetails.transactions,
  );

  // Get the logo as base64
  const logoBase64 = await getImageAsBase64();

  // Use invoiceItems if available (existing invoice), otherwise use selectedServices (new invoice)
  const items =
    invoiceDetails.invoiceItems && invoiceDetails.invoiceItems.length > 0
      ? invoiceDetails.invoiceItems.map((item: any) => ({
          name: item.serviceName,
          description: item.description || "",
          quantity: item.quantity,
          price: item.priceAtPurchase,
        }))
      : selectedServices?.map((service: any) => ({
          name: service.name,
          description: service.description || "",
          quantity: service.quantity,
          price: service.price,
        })) || [];

  const isNewInvoice =
    invoiceDetails.subTotal === 0 && invoiceDetails.totalAmount === 0;

  const displaySubTotal = isNewInvoice
    ? paymentDetails.subTotal
    : invoiceDetails.subTotal;
  const displayTotalAmount = isNewInvoice
    ? paymentDetails.totalAmount
    : invoiceDetails.totalAmount;
  const displayOffer = isNewInvoice
    ? paymentDetails.offer
    : invoiceDetails.offer;
  const displayDiscount = paymentDetails.discount || 0;
  const displayAmountPaid = isNewInvoice
    ? paymentDetails.amountPaid
    : amountPaidFromTransactions || invoiceDetails.amountPaid;
  const displayBalance = isNewInvoice
    ? paymentDetails.balance
    : displayTotalAmount - displayAmountPaid;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Invoice - ${invoiceDetails.id}</title>
      <style>
        @page {
          size: A4;
          margin: 0.2in;
        }

        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        body {
          font-family: 'Arial', 'Helvetica', sans-serif;
          font-size: 12px;
          line-height: 1.4;
          color: #333;
          background: white;
          width: 100%;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        
        .container {
          width: 100%;
          max-width: 100%;
          padding: 15px;
        }
        
        /* Header */
        .header {
          text-align: center;
          margin-bottom: 20px;
          border-bottom: 2px solid #e5e5e5;
          padding-bottom: 15px;
        }
        
        .logo-container {
          width: 80px;
          height: 50px;
          margin: 0 auto 10px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .logo-image {
          width: 80px;
          height: 50px;
          object-fit: contain;
          display: block;
        }
        
        .logo-fallback {
          width: 80px;
          height: 50px;
          background: #f97316;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: bold;
          font-size: 16px;
        }
        
        .company-name {
          font-size: 24px;
          font-weight: bold;
          color: #1f2937;
          margin-bottom: 5px;
        }
        
        .company-address {
          font-size: 11px;
          color: #6b7280;
          margin-bottom: 8px;
        }
        
        .company-contact {
          font-size: 11px;
          color: #6b7280;
        }
        
        /* Invoice Info */
        .invoice-info {
          display: flex;
          justify-content: space-between;
          margin-bottom: 20px;
          padding: 10px 0;
        }
        
        .invoice-number {
          font-size: 14px;
          font-weight: bold;
        }
        
        .invoice-date {
          font-size: 12px;
          color: #6b7280;
        }
        
        /* patientInfo and Payment Details */
        .details-section {
          display: flex;
          gap: 20px;
          margin-bottom: 25px;
        }
        
        .detail-card {
          flex: 1;
          background: #f9fafb;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 15px;
        }
        
        .detail-title {
          font-size: 13px;
          font-weight: bold;
          color: #374151;
          margin-bottom: 10px;
          border-bottom: 1px solid #d1d5db;
          padding-bottom: 5px;
        }
        
        .detail-item {
          display: flex;
          justify-content: space-between;
          margin-bottom: 5px;
          font-size: 11px;
        }
        
        .detail-label {
          color: #6b7280;
        }
        
        .detail-value {
          font-weight: 500;
          color: #1f2937;
        }
        
        /* Services Table */
        .services-section {
          margin-bottom: 25px;
        }
        
        .section-title {
          font-size: 14px;
          font-weight: bold;
          color: #374151;
          margin-bottom: 10px;
        }
        
        .services-table {
          width: 100%;
          border-collapse: collapse;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          overflow: hidden;
        }
        
        .table-header {
          background: #f3f4f6;
          font-weight: bold;
          font-size: 11px;
          color: #374151;
        }
        
        .table-header th {
          padding: 12px 8px;
          text-align: left;
          border-bottom: 1px solid #d1d5db;
        }

        .table-header th:nth-child(2),
        .table-header th:nth-child(3) {
          text-align: center;
        }

        .table-header th:nth-child(4) {
          text-align: center;
        }
        
        .table-row {
          border-bottom: 1px solid #e5e7eb;
        }
        
        .table-row:nth-child(even) {
          background: #f9fafb;
        }
        
        .table-row td {
          padding: 10px 8px;
          font-size: 11px;
          vertical-align: top;
        }
        
        .service-name {
          font-weight: 600;
          color: #1f2937;
          margin-bottom: 2px;
        }
        
        .service-description {
          font-size: 10px;
          color: #6b7280;
          line-height: 1.3;
        }
        
        .text-center {
          text-align: center;
        }
        
        .text-right {
          text-align: right;
        }
        
        /* Totals Section */
        .totals-section {
          margin-left: auto;
          width: 300px;
          margin-bottom: 25px;
        }
        
        .totals-table {
          width: 100%;
          border-collapse: collapse;
        }
        
        .totals-table td {
          padding: 8px 12px;
          font-size: 12px;
          border-bottom: 1px solid #e5e7eb;
        }
        
        .totals-label {
          color: #6b7280;
        }
        
        .totals-value {
          font-weight: 600;
          text-align: right;
          color: #1f2937;
        }
        
        .total-final {
          background: #f3f4f6;
          font-weight: bold;
          font-size: 14px;
          border-top: 2px solid #d1d5db;
        }
        
        .paid-amount {
          color: #059669;
        }
        
        .due-amount {
          color: #dc2626;
        }
        
        /* Notes Section */
        .notes-section {
          margin-bottom: 20px;
        }
        
        .notes-content {
          background: #fef3c7;
          border: 1px solid #f59e0b;
          border-radius: 6px;
          padding: 12px;
          font-size: 11px;
          color: #92400e;
        }
        
        /* Footer */
        .footer {
          text-align: center;
          background: #f3f4f6;
          padding: 15px;
          border-radius: 8px;
          border-top: 2px solid #e5e7eb;
        }
        
        .footer-title {
          font-size: 16px;
          font-weight: bold;
          color: #1f2937;
          margin-bottom: 5px;
        }
        
        .footer-subtitle {
          font-size: 12px;
          color: #6b7280;
          margin-bottom: 8px;
        }
        
        .footer-info {
          font-size: 10px;
          color: #9ca3af;
        }
      </style>
    </head>
    <body>
      <div class="container">
        
        <!-- Header -->
        <div class="header">
          <div class="logo-container">
            ${
              logoBase64
                ? `<img class="logo-image" src="${logoBase64}" alt="Thera-Cure Logo"  style="width:160px; height:auto;"/>`
                : `<div class="logo-fallback">TC</div>`
            }
          </div>
          <div class="company-address">
            361/A, Basudevpur Road, Ground Floor, Nilanjana Apartment<br>
            Shyamnagar, West Bengal, 743127, India
          </div>
          <div class="company-contact">
            Phone: (033) 3564 7255 | Email: contacts@mstheracure.com
          </div>
        </div>

        <!-- Invoice Info -->
        <div class="invoice-info">
          <div>
            <div class="invoice-number">Invoice No: ${invoiceDetails.id}</div>
          </div>
          <div class="text-right">
            <div class="invoice-date">Date: ${new Date(
              invoiceDetails.date,
            ).toLocaleDateString("en-IN")}</div>
            <div class="invoice-date">Status: ${invoiceDetails.status}</div>
          </div>
        </div>

        <!-- patientInfo and Payment Details -->
        <div class="details-section">
          <!-- Bill To -->
          <div class="detail-card">
            <div class="detail-title">BILL TO:</div>
            <div class="detail-item">
              <span class="detail-label">Patient Name:</span>
              <span class="detail-value">${patientInfo.patientName}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Patient ID:</span>
              <span class="detail-value">${patientInfo.id}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Phone:</span>
              <span class="detail-value">${patientInfo.phone}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Email:</span>
              <span class="detail-value">${patientInfo.email}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Address:</span>
              <span class="detail-value">${patientInfo.address}</span>
            </div>
          </div>

          <!-- Payment Details -->
          <div class="detail-card">
            <div class="detail-title">PAYMENT DETAILS:</div>
            ${
              latestPaymentDate
                ? `<div class="detail-item">
                  <span class="detail-label">Last Payment Date:</span>
                  <span class="detail-value">${new Date(
                    latestPaymentDate,
                  ).toLocaleDateString("en-IN")}</span>
                </div>`
                : ""
            }
            <div class="detail-item">
              <span class="detail-label">Payment Method:</span>
              <span class="detail-value">${paymentMethods}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Payment Status:</span>
              <span class="detail-value">${paymentDetails.status}</span>
            </div>
            ${
              displayOffer && displayOffer > 0
                ? `<div class="detail-item">
                  <span class="detail-label">Offer Applied:</span>
                  <span class="detail-value">${displayOffer}%</span>
                </div>`
                : ""
            }
            ${
              invoiceDetails.transactions &&
              invoiceDetails.transactions.length > 0
                ? `<div class="detail-item">
                  <span class="detail-label">Total Transactions:</span>
                  <span class="detail-value">${invoiceDetails.transactions.length}</span>
                </div>`
                : ""
            }
          </div>
        </div>

        <!-- Services Table -->
        <div class="services-section">
          <div class="section-title">SERVICES PROVIDED:</div>
          <table class="services-table">
            <thead class="table-header">
              <tr>
                <th style="width: 48%;">Service Description</th>
                <th style="width: 15%;">Qty</th>
                <th style="width: 18%;">Rate (₹)</th>
                <th style="width: 19%;">Amount (₹)</th>
              </tr>
            </thead>
            <tbody>
              ${items
                .map(
                  (item: any) => `
                <tr class="table-row">
                  <td>
                    <div class="service-name">${item.name}</div>
                    <div class="service-description">${
                      item.description || ""
                    }</div>
                  </td>
                  <td class="text-center">${item.quantity}</td>
                  <td class="text-center">${item.price.toLocaleString("en-IN", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}</td>
                  <td class="text-center">${(
                    item.price * item.quantity
                  ).toLocaleString("en-IN", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}</td>
                </tr>
              `,
                )
                .join("")}
            </tbody>
          </table>
        </div>

        <!-- Totals Section -->
        <div class="totals-section">
          <table class="totals-table">
            <tr>
              <td class="totals-label">Subtotal:</td>
              <td class="totals-value">₹${displaySubTotal.toLocaleString(
                "en-IN",
                { minimumFractionDigits: 2, maximumFractionDigits: 2 },
              )}</td>
            </tr>
            ${
              displayOffer && displayOffer > 0
                ? `
            <tr>
              <td class="totals-label">Discount (${displayOffer}%):</td>
              <td class="totals-value" style="color: #059669;">- ₹${displayDiscount.toLocaleString(
                "en-IN",
                { minimumFractionDigits: 2, maximumFractionDigits: 2 },
              )}</td>
            </tr>
            `
                : ""
            }
            <tr class="total-final">
              <td class="totals-label">Total Amount:</td>
              <td class="totals-value">₹${displayTotalAmount.toLocaleString(
                "en-IN",
                { minimumFractionDigits: 2, maximumFractionDigits: 2 },
              )}</td>
            </tr>
            <tr>
              <td class="totals-label">Amount Paid:</td>
              <td class="totals-value paid-amount">₹${displayAmountPaid.toLocaleString(
                "en-IN",
                { minimumFractionDigits: 2, maximumFractionDigits: 2 },
              )}</td>
            </tr>
            <tr>
              <td class="totals-label">
                ${displayBalance <= 0 ? "Paid (Change)" : "Balance Due"}:
              </td>
              <td
                class="totals-value ${
                  displayBalance <= 0 ? "paid-amount" : "due-amount"
                }"
              >
                ₹${Math.abs(displayBalance).toLocaleString("en-IN", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </td>
            </tr>
          </table>
        </div>

        

        <!-- Footer -->
        <div class="footer">
          <div class="footer-title">Thank you for choosing Thera-Cure!</div>
          <div class="footer-subtitle">Your health and recovery are our priority.</div>
          <div class="footer-info">
            For any queries regarding this invoice, please contact us at the above details.<br>
            Generated on: ${new Date().toLocaleString("en-IN")}
          </div>
        </div>

      </div>
    </body>
    </html>
  `;
};

export default generateInvoicePDF;
