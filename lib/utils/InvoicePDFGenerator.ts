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
        "--no-sandbox",
        "--disable-setuid-sandbox",
      ],
    };

    browser = await puppeteer.launch(launchConfig);

    const page = await browser.newPage();

    page.setDefaultTimeout(30000);

    const htmlTemplate = await generateInvoiceHTML(invoiceData);

    await page.setContent(htmlTemplate, {
      waitUntil: "domcontentloaded",
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

// Helper function to safely display values (don't show null/undefined)
const safeValue = (value: any, fallback: string = ""): string => {
  if (
    value === null ||
    value === undefined ||
    value === "null" ||
    value === "undefined"
  ) {
    return fallback;
  }
  if (typeof value === "string" && value.trim() === "") {
    return fallback;
  }
  return String(value);
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
  const displayOffer =
    (isNewInvoice ? paymentDetails.offer : invoiceDetails.offer) ?? 0;
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
        /* A4 Paper with exact dimensions - consistent with prescription */
        @page {
          size: A4 portrait;
          margin: 4mm 6mm 4mm 6mm;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }

        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }

        html {
          width: 210mm;
          height: 297mm;
        }

        body {
          font-family: 'Roboto', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Arial', 'Helvetica', sans-serif;
          font-size: 10pt;
          line-height: 1.35;
          color: #1f2937;
          background: white;
          width: 100%;
          height: 100%;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        
        /* Container - Fixed Layout */
        .container {
          width: 100%;
          max-width: 100%;
          padding: 10px 12px;
        }

        /* Header - Large and Clear */
        .header {
          text-align: center;
          margin-bottom: 15px;
          border-bottom: 6px solid #8fcbe5;
          padding-bottom: 12px;
          page-break-inside: avoid;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }

        .logo-container {
          width: 100%;
          height: 180px;
          margin: 0 0 1px 0;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .logo-image {
          width: 660px;
          max-width: 660px;
          height: auto;
          max-height: 180px;
          object-fit: contain;
          display: block;
        }

        .logo-fallback {
          width: 100px;
          height: 50px;
          background: #0054a6;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: bold;
          font-size: 20px;
          letter-spacing: 2px;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }

        .company-address {
          font-size: 10.5pt;
          color: #231f20;
          margin-bottom: 4px;
          line-height: 1.4;
          font-weight: 600;
        }

        .company-contact {
          font-size: 11pt;
          color: #0054a6;
          font-weight: 700;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        
        /* Invoice Info - Clear and Prominent */
        .invoice-info {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
          padding: 10px 15px;
          background: #f8f9fa;
          border: 1.5px solid #ddd;
          border-radius: 6px;
          page-break-inside: avoid;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }

        .invoice-number {
          font-size: 13pt;
          font-weight: 800;
          color: #1a237e;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }

        .invoice-date {
          font-size: 10pt;
          color: #444;
          font-weight: 600;
        }

        /* Details Section */
        .details-section {
          display: flex;
          gap: 15px;
          margin-bottom: 15px;
          page-break-inside: avoid;
        }

        .detail-card {
          flex: 1;
          max-width: 50%;
          background: #f8f9fa;
          border: 1px solid #ddd;
          border-radius: 4px;
          padding: 10px 12px;
          page-break-inside: avoid;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }

        .detail-title {
          font-size: 10.5pt;
          font-weight: 800;
          color: #0054a6;
          margin-bottom: 6px;
          border-bottom: 1.5px solid #d0d0d0;
          padding-bottom: 4px;
          text-transform: uppercase;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }

        .detail-item {
          display: flex;
          justify-content: space-between;
          margin-bottom: 4px;
          font-size: 9.5pt;
          line-height: 1.4;
        }

        .detail-label {
          color: #555;
          font-weight: 700;
        }

        .detail-value {
          font-weight: 600;
          color: #000;
          text-align: right;
        }
        
        /* Services Table */
        .services-section {
          margin-bottom: 15px;
          page-break-inside: avoid;
        }

        .section-title {
          font-size: 10.5pt;
          font-weight: 800;
          color: #0054a6;
          margin-bottom: 8px;
          text-transform: uppercase;
          border-bottom: 1.5px solid #d0d0d0;
          padding-bottom: 4px;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }

        .services-table {
          width: 100%;
          border-collapse: collapse;
          border: 1px solid #ddd;
          border-radius: 6px;
          overflow: hidden;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }

        .table-header {
          background: #f3f4f6;
          font-weight: 800;
          font-size: 9.5pt;
          color: #374151;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }

        .table-header th {
          padding: 8px 10px;
          text-align: left;
          border-bottom: 2.5px solid #d0d0d0;
        }

        .table-row td {
          padding: 8px 10px;
          font-size: 10pt;
          line-height: 1.4;
          border-bottom: 1px solid #e5e7eb;
        }

        .service-name {
          font-weight: 700;
          color: #000;
          font-size: 10.5pt;
          margin-bottom: 2px;
        }

        .service-description {
          font-size: 9pt;
          color: #555;
        }
        
        /* Totals Section */
        .totals-section {
          margin-left: auto;
          width: 320px;
          margin-bottom: 15px;
          page-break-inside: avoid;
        }

        .totals-table {
          width: 100%;
          border-collapse: collapse;
          border: 1px solid #ddd;
          border-radius: 6px;
        }

        .totals-table td {
          padding: 7px 12px;
          font-size: 10pt;
          border-bottom: 1px solid #e5e7eb;
          line-height: 1.4;
        }

        .total-final {
          background: #f3f4f6;
          font-weight: 800;
          font-size: 11.5pt;
          border-top: 2.5px solid #d0d0d0;
        }

        .paid-amount { color: #059669; font-weight: 800; }
        .due-amount { color: #dc2626; font-weight: 800; }
        
        /* Footer - Information and Taglines */
        .footer {
          text-align: center;
          background: #f8f9fa;
          padding: 12px 15px;
          border-radius: 6px;
          border-top: 4px solid #0054a6;
          margin-top: 15px;
          page-break-inside: avoid;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }

        .footer-title {
          font-size: 13pt;
          font-weight: 800;
          color: #0054a6;
          margin-bottom: 4px;
        }

        .footer-tagline {
          font-size: 10.5pt;
          color: #374151;
          margin-bottom: 8px;
          font-weight: 600;
          font-style: italic;
        }

        .footer-info {
          font-size: 9pt;
          color: #666;
          line-height: 1.5;
        }

        @media print {
          body { width: 210mm; height: 297mm; }
          .container { page-break-after: avoid; }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <!-- Header -->
        <div class="header">
          <div class="logo-container">
            ${logoBase64 ? `<img class="logo-image" src="${logoBase64}" />` : `<div class="logo-fallback">TC</div>`}
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
          <div class="invoice-number">Invoice No: ${invoiceDetails.id}</div>
          <div class="text-right">
            <div class="invoice-date">Date: ${new Date(invoiceDetails.date).toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata" })}</div>
            <div class="invoice-date">Status: ${invoiceDetails.status}</div>
          </div>
        </div>

        <!-- patientInfo and Payment Details -->
        <div class="details-section">
          <div class="detail-card">
            <div class="detail-title">BILL TO:</div>
            ${safeValue(patientInfo.patientName) ? `<div class="detail-item"><span class="detail-label">Name:</span><span class="detail-value">${safeValue(patientInfo.patientName)}</span></div>` : ""}
            ${safeValue(patientInfo.id) ? `<div class="detail-item"><span class="detail-label">ID:</span><span class="detail-value">${safeValue(patientInfo.id)}</span></div>` : ""}
            ${safeValue(patientInfo.phone) ? `<div class="detail-item"><span class="detail-label">Phone:</span><span class="detail-value">${safeValue(patientInfo.phone)}</span></div>` : ""}
            ${safeValue(patientInfo.address) ? `<div class="detail-item"><span class="detail-label">Address:</span><span class="detail-value">${safeValue(patientInfo.address)}</span></div>` : ""}
          </div>
          <div class="detail-card">
            <div class="detail-title">PAYMENT:</div>
            ${safeValue(paymentMethods) && paymentMethods !== "N/A" ? `<div class="detail-item"><span class="detail-label">Method:</span><span class="detail-value">${safeValue(paymentMethods)}</span></div>` : ""}
            ${safeValue(paymentDetails.status) ? `<div class="detail-item"><span class="detail-label">Status:</span><span class="detail-value">${safeValue(paymentDetails.status)}</span></div>` : ""}
            ${displayOffer > 0 ? `<div class="detail-item"><span class="detail-label">Offer:</span><span class="detail-value">${displayOffer}%</span></div>` : ""}
          </div>
        </div>

        <!-- Services Table -->
        <div class="services-section">
          <div class="section-title">SERVICES PROVIDED:</div>
          <table class="services-table">
            <thead class="table-header">
              <tr>
                <th style="width: 50%;">Description</th>
                <th style="width: 10%; text-align: center;">Qty</th>
                <th style="width: 20%; text-align: center;">Rate (₹)</th>
                <th style="width: 20%; text-align: center;">Amount (₹)</th>
              </tr>
            </thead>
            <tbody>
              ${items
                .map(
                  (item) => `
                <tr class="table-row">
                  <td><div class="service-name">${item.name}</div><div class="service-description">${item.description || ""}</div></td>
                  <td style="text-align: center;">${item.quantity}</td>
                  <td style="text-align: center;">${item.price.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                  <td style="text-align: center;">${(item.price * item.quantity).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                </tr>
              `,
                )
                .join("")}
            </tbody>
          </table>
        </div>

        <!-- Transaction History (Only if brief) -->
        ${
          invoiceDetails.transactions &&
          invoiceDetails.transactions.filter((t: any) => t.status === "SUCCESS")
            .length > 0
            ? `
        <div class="services-section">
          <div class="section-title">PAYMENT HISTORY:</div>
          <table class="services-table">
            <thead class="table-header">
              <tr>
                <th style="width: 8%; text-align: center;">Sl. No</th>
                <th style="width: 35%;">Date &amp; Time</th>
                <th style="width: 30%;">Payment Method</th>
                <th style="width: 27%; text-align: right; padding-right: 12px;">Amount (₹)</th>
              </tr>
            </thead>
            <tbody>
              ${invoiceDetails.transactions
                .filter((t: any) => t.status === "SUCCESS")
                .map((t: any, i: number) => {
                  const d = new Date(t.transactionDate);
                  const dateStr = d.toLocaleDateString("en-IN", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                    timeZone: "Asia/Kolkata",
                  });
                  const timeStr = d.toLocaleTimeString("en-IN", {
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: true,
                    timeZone: "Asia/Kolkata",
                  });
                  return `
                <tr class="table-row">
                  <td style="text-align: center;">${i + 1}</td>
                  <td>${dateStr}, ${timeStr}</td>
                  <td style="text-transform: capitalize;">${t.paymentMethod || "N/A"}</td>
                  <td style="text-align: right; padding-right: 12px; font-weight: 700;">₹${parseFloat(t.amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                </tr>
              `;
                })
                .join("")}
            </tbody>
          </table>
        </div>`
            : ""
        }

        <!-- Totals Section -->
        <div class="totals-section">
          <table class="totals-table">
            <tr><td>Subtotal:</td><td style="text-align: right;">₹${displaySubTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td></tr>
            ${displayOffer > 0 ? `<tr><td>Discount (${displayOffer}%):</td><td style="text-align: right; color: #059669;">- ₹${displayDiscount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td></tr>` : ""}
            <tr class="total-final"><td><b>Total Amount:</b></td><td style="text-align: right;"><b>₹${displayTotalAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</b></td></tr>
            <tr><td>Amount Paid:</td><td style="text-align: right;" class="paid-amount">₹${displayAmountPaid.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td></tr>
            ${displayBalance > 0 ? `<tr><td><b>Balance Due:</b></td><td style="text-align: right;" class="due-amount"><b>₹${displayBalance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</b></td></tr>` : ""}
          </table>
        </div>

        <!-- Footer -->
        <div class="footer">
          <div class="footer-title">Thank you for choosing Thera-Cure!</div>
          <div class="footer-tagline">Your health and recovery are our priority.</div>
          <div class="footer-info">
            For any queries regarding this invoice, please contact us at the above details.<br>
            Generated on: ${new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
};

export default generateInvoicePDF;
