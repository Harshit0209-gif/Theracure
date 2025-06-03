// /lib/generateInvoicePDF.js
import puppeteer from "puppeteer";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

// Get current directory for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const generateInvoicePDF = async (invoiceData: any) => {
	let browser;

	try {
		browser = await puppeteer.launch({
			headless: true,
			args: [
				"--no-sandbox",
				"--disable-setuid-sandbox",
				"--disable-dev-shm-usage",
				"--disable-accelerated-2d-canvas",
				"--no-first-run",
				"--no-zygote",
				"--disable-gpu",
			],
		});

		const page = await browser.newPage();

		// Generate HTML template with data
		const htmlTemplate = await generateInvoiceHTML(invoiceData);

		await page.setContent(htmlTemplate, { waitUntil: "networkidle0" });

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
		});

		return pdfBuffer;
	} catch (error) {
		console.error("PDF generation error:", error);
		throw error;
	} finally {
		if (browser) {
			await browser.close();
		}
	}
};

// Function to convert image to base64
const getImageAsBase64 = async () => {
	try {
		// Construct the path to the image
		// Assuming this file is in /lib/ and image is in app/lib/utils/
		const imagePath = path.resolve(__dirname, "../utils/apple-touch-icon.png");

		// Alternative paths to try if the above doesn't work
		const alternativePaths = [
			path.resolve(__dirname, "./utils/apple-touch-icon.png"),
			path.resolve(__dirname, "../app/lib/utils/apple-touch-icon.png"),
			path.resolve(process.cwd(), "app/lib/utils/apple-touch-icon.png"),
			path.resolve(process.cwd(), "lib/utils/apple-touch-icon.png"),
		];

		let imageBuffer;
		let foundPath = null;

		// Try the main path first
		try {
			imageBuffer = await fs.readFile(imagePath);
			foundPath = imagePath;
		} catch (error) {
			// Try alternative paths
			for (const altPath of alternativePaths) {
				try {
					imageBuffer = await fs.readFile(altPath);
					foundPath = altPath;
					break;
				} catch (altError) {
					continue;
				}
			}
		}

		if (!imageBuffer) {
			console.warn("Logo image not found at any of the expected paths:", [
				imagePath,
				...alternativePaths,
			]);
			return null;
		}

		console.log("Logo image found at:", foundPath);

		// Convert to base64
		const base64String = imageBuffer.toString("base64");

		// Determine MIME type based on file extension
		const ext = path.extname(foundPath).toLowerCase();
		let mimeType = "image/png"; // default

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

// HTML Template Generator Function (now async)
const generateInvoiceHTML = async (data: any) => {
	const {
		patientInfo,
		invoiceDetails,
		paymentDetails,
		selectedServices,
		notes,
	} = data;

	// Get the logo as base64
	const logoBase64 = await getImageAsBase64();

	return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Invoice - ${invoiceDetails.invoiceId}</title>
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
          font-family: 'Arial', sans-serif;
          font-size: 12px;
          line-height: 1.4;
          color: #333;
          background: white;
          width: 100%;
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
        .table-header th:nth-child(3),
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
								? `<img class="logo-image" src="${logoBase64}" alt="Thera-Cure Logo"  style="width:140px; height:auto;"/>`
								: `<div class="logo-fallback">TC</div>`
						}
          </div>
          <div class="company-name">THERA-CURE</div>
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
            <div class="invoice-number">Invoice No: ${
							invoiceDetails.invoiceId
						}</div>
          </div>
          <div class="text-right">
            <div class="invoice-date">Date: ${new Date(
							invoiceDetails.date
						).toLocaleDateString("en-IN")}</div>
          </div>
        </div>

        <!-- patientInfo and Payment Details -->
        <div class="details-section">
          <!-- Bill To -->
          <div class="detail-card">
            <div class="detail-title">BILL TO:</div>
            <div class="detail-item">
              <span class="detail-label">Patient Name:</span>
              <span class="detail-value">${patientInfo.name}</span>
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
            <div class="detail-item">
              <span class="detail-label">Payment Date:</span>
              <span class="detail-value">${new Date(
								paymentDetails.paymentDate
							).toLocaleDateString("en-IN")}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Payment Method:</span>
              <span class="detail-value">${paymentDetails.paymentMethod.toUpperCase()}</span>
            </div>
            ${
							paymentDetails.offer > 0
								? `<div class="detail-item">
                  <span class="detail-label">Offer Applied:</span>
                  <span class="detail-value">${paymentDetails.offer}%</span>
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
                <th style="width: 50%;">Service Description</th>
                <th style="width: 12%;">Qty</th>
                <th style="width: 19%;">Rate (₹)</th>
                <th style="width: 19%;">Amount (₹)</th>
              </tr>
            </thead>
            <tbody>
              ${selectedServices
								.map(
									(service: any) => `
                <tr class="table-row">
                  <td>
                    <div class="service-name">${service.name}</div>
                    <div class="service-description">${
											service.description
										}</div>
                  </td>
                  <td class="text-center">${service.quantity}</td>
                  <td class="text-center">${service.price.toLocaleString(
										"en-IN"
									)}</td>
                  <td class="text-center">${(
										service.price * service.quantity
									).toLocaleString("en-IN")}</td>
                </tr>
              `
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
              <td class="totals-value">₹${paymentDetails.subTotal.toLocaleString(
								"en-IN"
							)}</td>
            </tr>
            ${
							paymentDetails.offer > 0
								? `
            <tr>
              <td class="totals-label">Discount (${paymentDetails.offer}%):</td>
              <td class="totals-value" style="color: #059669;">- ₹${paymentDetails.offerAmount.toLocaleString(
								"en-IN"
							)}</td>
            </tr>
            `
								: ""
						}
            <tr class="total-final">
              <td class="totals-label">Total Amount:</td>
              <td class="totals-value">₹${paymentDetails.totalAmount.toLocaleString(
								"en-IN"
							)}</td>
            </tr>
            <tr>
              <td class="totals-label">Amount Paid:</td>
              <td class="totals-value paid-amount">₹${paymentDetails.amountPaid.toLocaleString(
								"en-IN"
							)}</td>
            </tr>
            <tr>
              <td class="totals-label">Due:</td>
              <td class="totals-value ${
								paymentDetails.due > 0 ? "due-amount" : "paid-amount"
							}">
                ₹${Math.abs(paymentDetails.due).toLocaleString("en-IN")}
              </td>
            </tr>
          </table>
        </div>

        ${
					invoiceDetails.notes
						? `
        <!-- Notes Section -->
        <div class="notes-section">
          <div class="section-title">NOTES:</div>
          <div class="notes-content">
            ${notes}
          </div>
        </div>
        `
						: ""
				}

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
