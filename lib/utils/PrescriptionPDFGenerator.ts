import puppeteer from "puppeteer";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

// Get current directory for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
    const ext = foundPath ? path.extname(foundPath).toLowerCase() : "";
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

const generateAssessmentPDF = async (assessment: any) => {
  const { patientInfo, therapist, assessmentData } = assessment;

  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  const page = await browser.newPage();

  // Get the logo as base64
  const logoBase64 = await getImageAsBase64();

  // Helper function to check if field has value
  const hasValue = (value: any) => {
    return value && value.toString().trim() !== "";
  };

  // Helper function to render section conditionally
  const renderSection = (
    label: string,
    value: any,
    className: string = "assessment-section"
  ) => {
    if (!hasValue(value)) return "";
    return `
      <div class="${className}">
        <div class="section-label">${label}:</div>
        <div class="section-content">${value}</div>
      </div>
    `;
  };

  // Helper function to render two-column sections
  const renderTwoColumnSection = (
    leftLabel: string,
    leftValue: any,
    rightLabel: string,
    rightValue: any
  ) => {
    const leftHasValue = hasValue(leftValue);
    const rightHasValue = hasValue(rightValue);

    if (!leftHasValue && !rightHasValue) return "";

    if (leftHasValue && rightHasValue) {
      return `
        <div class="two-column">
          <div class="column">
            <div class="assessment-section">
              <div class="section-label">${leftLabel}:</div>
              <div class="section-content">${leftValue}</div>
            </div>
          </div>
          <div class="column">
            <div class="assessment-section">
              <div class="section-label">${rightLabel}:</div>
              <div class="section-content">${rightValue}</div>
            </div>
          </div>
        </div>
      `;
    } else if (leftHasValue) {
      return `
        <div class="assessment-section">
          <div class="section-label">${leftLabel}:</div>
          <div class="section-content">${leftValue}</div>
        </div>
      `;
    } else {
      return `
        <div class="assessment-section">
          <div class="section-label">${rightLabel}:</div>
          <div class="section-content">${rightValue}</div>
        </div>
      `;
    }
  };

  // HTML Template
  const htmlTemplate = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>OPD Assessment Sheet - Thera-Cure</title>
      <style>
        @page {
          size: A4;
          margin: 8mm;
        }
        
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          font-size: 11px;
          line-height: 1.3;
          color: #2c3e50;
          background: white;
          width: 194mm;
          height: 275mm;
          position: relative;
          overflow: hidden;
        }
        
        .page {
          padding: 0;
          position: relative;
          height: 100%;
          display: flex;
          flex-direction: column;
        }
        
        /* Header Section */
        .header {
          display: flex;
          align-items: flex-start;
          margin-bottom: 10px;
          border-bottom: 2px solid #3498db;
          padding-bottom: 8px;
          flex-shrink: 0;
        }
        
        .clinic-info {
          flex: 1;
        }
        
        .contact-info {
          font-size: 9px;
          line-height: 1.2;
          color: #495057;
        }
        
        .contact-info p {
          margin-bottom: 1px;
        }
        
        .doctor-info {
          width: 300px;
          flex-shrink: 0;
          text-align: right;
          font-size: 9px;
        }
        
        .doctor-name {
          font-size: 16px;
          font-weight: bold;
          color: #e74c3c;
          margin-bottom: 3px;
        }
        
        .doctor-qualifications {
          font-size: 8px;
          line-height: 1.1;
          color: #6c757d;
          margin-bottom: 3px;
        }
        
        .doctor-details {
          font-size: 8px;
          line-height: 1.1;
          color: #868e96;
        }
        
        /* Form Title */
        .form-title {
          background: linear-gradient(135deg, #3498db, #2980b9);
          color: white;
          text-align: center;
          padding: 8px;
          font-size: 14px;
          font-weight: bold;
          margin: 8px 0;
          border-radius: 4px;
          letter-spacing: 1px;
          flex-shrink: 0;
        }
        
        /* Patient Info Section with Body Diagram */
        .patient-info-container {
          margin-bottom: 12px;
          flex-shrink: 0;
        }
        
        .patient-info {
          background: #f8f9fa;
          padding: 10px;
          border-radius: 5px;
          border-left: 4px solid #3498db;
          margin-bottom: 10px;
        }
        
        .patient-info-title {
          font-size: 11px;
          font-weight: bold;
          color: #2c3e50;
          margin-bottom: 8px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .patient-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 6px 15px;
          font-size: 10px;
        }
        
        .patient-field {
          display: flex;
          align-items: baseline;
        }
        
        .patient-field-label {
          font-weight: 600;
          color: #495057;
          min-width: 70px;
          margin-right: 6px;
        }
        
        .patient-field-value {
          color: #2c3e50;
          font-weight: 400;
        }
        
        /* Body Diagram Placeholder - Positioned after patient info */
        .body-diagram-placeholder {
          width: 120px;
          height: 140px;
          border: 2px dashed #3498db;
          border-radius: 8px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background: #f8f9fa;
          margin-left: auto;
          margin-right: 0;
        }
        
        .body-diagram-placeholder .placeholder-icon {
          width: 60px;
          height: 80px;
          background-image: url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iODAiIHZpZXdCb3g9IjAgMCA2MCA4MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTMwIDEwQzMzLjMxMzcgMTAgMzYgMTIuNjg2MyAzNiAxNkMzNiAxOS4zMTM3IDMzLjMxMzcgMjIgMzAgMjJDMjYuNjg2MyAyMiAyNCAxOS4zMTM3IDI0IDE2QzI0IDEyLjY4NjMgMjYuNjg2MyAxMCAzMCAxMFoiIHN0cm9rZT0iIzM0OThkYiIgc3Ryb2tlLXdpZHRoPSIyIiBmaWxsPSJub25lIi8+CjxwYXRoIGQ9Ik0zMCAyMlY0NSIgc3Ryb2tlPSIjMzQ5OGRiIiBzdHJva2Utd2lkdGg9IjIiLz4KPHA+tnMgZD0iTTEyIDI4TDMwIDIyTDQ4IDI4IiBzdHJva2U9IiMzNDk4ZGIiIHN0cm9rZS13aWR0aD0iMiIgZmlsbD0ibm9uZSIvPgo8cGF0aCBkPSJNMzAgNDVMMTYgNjgiIHN0cm9rZT0iIzM0OThkYiIgc3Ryb2tlLXdpZHRoPSIyIi8+CjxwYXRoIGQ9Ik0zMCA0NUw0NCA2OCIgc3Ryb2tlPSIjMzQ5OGRiIiBzdHJva2Utd2lkdGg9IjIiLz4KPHA+tnMgZD0iTTE2IDY4TDEyIDc4IiBzdHJva2U9IiMzNDk4ZGIiIHN0cm9rZS13aWR0aD0iMiIvPgo8cGF0aCBkPSJNMTYgNjhMMjAgNzgiIHN0cm9rZT0iIzM0OThkYiIgc3Ryb2tlLXdpZHRoPSIyIi8+CjxwYXRoIGQ9Ik00NCA2OEw0MCA3OCIgc3Ryb2tlPSIjMzQ5OGRiIiBzdHJva2Utd2lkdGg9IjIiLz4KPHA+tnMgZD0iTTQ0IDY4TDQ4IDc4IiBzdHJva2U9IiMzNDk4ZGIiIHN0cm9rZS13aWR0aD0iMiIvPgo8L3N2Zz4K');
          background-repeat: no-repeat;
          background-position: center;
          background-size: contain;
          margin-bottom: 8px;
        }
        
        .placeholder-text {
          font-size: 8px;
          color: #6c757d;
          text-align: center;
          font-weight: 500;
        }
        
        /* Content Container */
        .content-container {
          flex: 1;
          display: flex;
          flex-direction: column;
          min-height: 0;
        }
        
        .assessment-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          flex: 1;
        }
        
        .assessment-column {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        
        /* Assessment Fields */
        .assessment-section {
          flex-shrink: 0;
        }
        
        .section-label {
          font-weight: 600;
          margin-bottom: 4px;
          color: #2c3e50;
          font-size: 10px;
          padding-bottom: 2px;
          border-bottom: 1px solid #3498db;
          display: inline-block;
        }
        
        .section-content {
          margin-top: 4px;
          padding: 4px 0;
          font-size: 9px;
          line-height: 1.4;
          color: #2c3e50;
          min-height: 30px;
          max-height: 80px;
          overflow: hidden;
          background: transparent;
          border: none;
          white-space: pre-wrap;
          word-wrap: break-word;
        }
        
        .two-column {
          display: flex;
          gap: 12px;
          margin-bottom: 8px;
        }
        
        .column {
          flex: 1;
        }
        
        /* Footer */
        .footer {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          background: linear-gradient(135deg, #e74c3c, #c0392b);
          color: white;
          text-align: center;
          padding: 6px;
          font-size: 9px;
          font-weight: 600;
          border-radius: 4px;
          letter-spacing: 0.3px;
        }
        
        .signature-section {
          position: absolute;
          bottom: 18mm;
          right: 0;
          text-align: right;
        }
        
        .signature-line {
          border-bottom: 1px solid #495057;
          width: 130px;
          margin: 10px 0 4px auto;
        }
        
        .signature-text {
          font-style: italic;
          margin-bottom: 4px;
          color: #6c757d;
          font-size: 9px;
        }
        
        .signature-name {
          font-size: 8px;
          margin-top: 4px;
          color: #495057;
          font-weight: 500;
        }
        
        /* Logo Watermark - Increased Size */
        .logo-watermark {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%) rotate(-20deg);
          opacity: 0.04;
          z-index: 0;
          pointer-events: none;
        }
        
        .logo-watermark img {
          width: 300px;
          height: auto;
        }
        
        .logo-watermark .fallback-logo {
          width: 300px;
          height: 300px;
          background: linear-gradient(135deg, #3498db, #2980b9);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: rgba(255, 255, 255, 0.8);
          font-weight: bold;
          font-size: 80px;
          letter-spacing: 3px;
        }
        
        @media print {
          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
          
          .page {
            page-break-after: avoid;
            page-break-inside: avoid;
          }
          
          .assessment-section {
            page-break-inside: avoid;
          }
        }
      </style>
    </head>
    <body>
      <div class="page">
        <!-- Logo Watermark -->
        <div class="logo-watermark">
          ${
            logoBase64
              ? `<img src="${logoBase64}" alt="Thera-Cure Logo Watermark" />`
              : `<div class="fallback-logo">TC</div>`
          }
        </div>
        
        <!-- Header -->
        <div class="header">
          <div class="clinic-info" style="margin-top:-15px;">
            <div class="logo">
              ${
                logoBase64
                  ? `<img class="logo-image" src="${logoBase64}" alt="Thera-Cure Logo" style="width:130px; height:auto;"/>`
                  : `<div class="logo-fallback">TC</div>`
              }
            </div>
            <div class="contact-info" style="width:200px;">
              <p><strong>ADDRESS:</strong> 361/A, BASUDEVPUR ROAD, GROUND FLOOR - 'NILANJANA' APARTMENT, SHYAMNAGAR, NORTH 24 PARGANAS, PIN - 743127</p>
              <p><strong>Tel:</strong> (033) 3564 7255</p>
              <p><strong>Email:</strong> contacts@mstheracure.com</p>
              <p><strong>Website:</strong> www.mstheracure.com</p>
              <p style="margin-top: 3px; font-weight: bold;">Time: Monday to Saturday (9:00 AM to 7:00 PM)</p>
              <p style="font-weight: bold; color: #e74c3c;">SUNDAY CLOSED</p>
            </div>
          </div>
          
          <div class="doctor-info">
            <div class="doctor-name">${
              therapist?.user?.name ||
              therapist?.name ||
              "Dr. Diksha Palit (PT)"
            }</div>
            <div class="doctor-qualifications">
              ${
                therapist?.qualification ||
                "B.P.T [W.B.U.H.S], CDNT<br>Co-Founder & Consultant Physiotherapist"
              }
            </div>
            <div class="doctor-details">
              ${
                therapist?.specialization ||
                "Physiotherapy & Rehabilitation Specialist"
              }
            </div>
          </div>
        </div>
        
        <!-- Form Title -->
        <div class="form-title">OPD ASSESSMENT SHEET</div>
        
        <!-- Patient Information with Body Diagram -->
        <div class="patient-info-container">
          <div class="patient-info">
            <div class="patient-info-title">Patient Information</div>
            <div class="patient-grid">
              <div class="patient-field">
                <span class="patient-field-label">Name:</span>
                <span class="patient-field-value">${
                  patientInfo?.patientName ||
                  patientInfo?.name ||
                  assessmentData?.patientName ||
                  "N/A"
                }</span>
              </div>
              <div class="patient-field">
                <span class="patient-field-label">Age:</span>
                <span class="patient-field-value">${
                  patientInfo?.age || assessmentData?.age || "N/A"
                } years</span>
              </div>
              <div class="patient-field">
                <span class="patient-field-label">Gender:</span>
                <span class="patient-field-value">${
                  patientInfo?.gender || assessmentData?.gender || "N/A"
                }</span>
              </div>
              <div class="patient-field">
                <span class="patient-field-label">Height:</span>
                <span class="patient-field-value">${
                  patientInfo?.height || assessmentData?.height || "N/A"
                } cms</span>
              </div>
              <div class="patient-field">
                <span class="patient-field-label">Weight:</span>
                <span class="patient-field-value">${
                  patientInfo?.weight || assessmentData?.weight || "N/A"
                } kgs</span>
              </div>
              <div class="patient-field">
                <span class="patient-field-label">Patient ID:</span>
                <span class="patient-field-value">THRC${
                  patientInfo?.id ||
                  patientInfo?.patientId ||
                  assessmentData?.patientId ||
                  "N/A"
                }</span>
              </div>
              <div class="patient-field">
                <span class="patient-field-label">Date:</span>
                <span class="patient-field-value">${
                  assessmentData?.assessmentDate || assessmentData?.createdAt
                    ? new Date(
                        assessmentData.assessmentDate ||
                          assessmentData.createdAt
                      ).toLocaleDateString("en-IN")
                    : new Date().toLocaleDateString("en-IN")
                }</span>
              </div>
            </div>
          </div>
          
          <!-- Body Diagram Placeholder -->
          <div class="body-diagram-placeholder">
            <div class="placeholder-icon"></div>
            <div class="placeholder-text">Patient Photo<br/>Placeholder</div>
          </div>
        </div>
        
        <!-- Content Container -->
        <div class="content-container">
          <!-- Assessment Grid Layout -->
          <div class="assessment-grid">
            <!-- Left Column -->
            <div class="assessment-column">
              ${renderSection(
                "Chief Complaints",
                assessmentData?.chiefComplaints
              )}
              ${renderSection("H/O", assessmentData?.historyOfIllness)}
              ${renderSection("On Observation", assessmentData?.onObservation)}
              ${renderSection(
                "Differential Diagnosis",
                assessmentData?.differentialDiagnosis
              )}
              ${renderSection("Special Tests", assessmentData?.specialTests)}
            </div>
            
            <!-- Right Column -->
            <div class="assessment-column">
              ${renderSection(
                "On Examinations",
                assessmentData?.onExaminations
              )}
              ${renderSection("On Palpation", assessmentData?.onPalpation)}
              ${renderSection("Investigations", assessmentData?.investigations)}
              ${renderSection(
                "Provisional Diagnosis",
                assessmentData?.provisionalDiagnosis
              )}
              ${renderSection(
                "Physiotherapy Management",
                assessmentData?.physiotherapyMgmt
              )}
            </div>
          </div>
        </div>
        
        <!-- Signature Section -->
        <div class="signature-section">
          <div class="signature-text">Signature</div>
          <div class="signature-line"></div>
          <div class="signature-name">
            ${therapist?.user?.name || therapist?.name || "Physiotherapist"}
          </div>
        </div>
        
        <!-- Footer -->
        <div class="footer">
          IN CASE OF ANY EMERGENCY CONTACT THE NEAREST HOSPITAL IMMEDIATELY
        </div>
      </div>
    </body>
    </html>
  `;

  await page.setContent(htmlTemplate, { waitUntil: "networkidle0" });

  const pdfBuffer = await page.pdf({
    format: "A4",
    printBackground: true,
    margin: {
      top: "0mm",
      right: "0mm",
      bottom: "0mm",
      left: "0mm",
    },
    preferCSSPageSize: true,
  });

  await browser.close();
  return pdfBuffer;
};

export default generateAssessmentPDF;
