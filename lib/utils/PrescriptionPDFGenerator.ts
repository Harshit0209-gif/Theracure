import puppeteer from "puppeteer";
import path from "path";
import { fileURLToPath } from "url";
import { getImagesAsBase64 } from "./imageUtils.node";

// Get current directory for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const generateAssessmentPDF = async (assessment: any) => {
  const { patientInfo, therapist, assessmentData } = assessment;

  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  const page = await browser.newPage();

  // Get the logo as base64
  const images = await getImagesAsBase64([
    "apple-touch-icon.png",
    "humen-body.jpg",
  ]);

  const logoBase64 = images["apple-touch-icon.png"];
  const bodyBase64 = images["humen-body.jpg"];

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
        font-family: 'Times New Roman', serif;
        font-size: 13px;
        line-height: 1.4;
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
      
      .logo-image {
        width: 130px;
        height: auto;
      }
      
      .logo-fallback {
        width: 130px;
        height: 60px;
        background: linear-gradient(135deg, #3498db, #2980b9);
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: bold;
        font-size: 24px;
        letter-spacing: 2px;
      }
      
      .contact-info {
        font-size: 11px;
        line-height: 1.3;
        color: #495057;
        width: 200px;
        margin-top: 5px;
      }
      
      .contact-info p {
        margin-bottom: 1px;
      }
      
      .doctor-info {
        width: 300px;
        flex-shrink: 0;
        text-align: right;
        font-size: 11px;
      }
      
      .doctor-name {
        font-size: 16px;
        font-weight: bold;
        color: #e74c3c;
        margin-bottom: 3px;
      }
      
      .doctor-qualifications {
        font-size: 10px;
        line-height: 1.2;
        color: #6c757d;
        margin-bottom: 3px;
      }
      
      .doctor-details {
        font-size: 10px;
        line-height: 1.2;
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
      
      /* Patient Info Section */
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
        font-size: 13px;
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
        font-size: 12px;
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
      
      /* Content Container */
      .content-container {
        flex: 1;
        display: flex;
        flex-direction: column;
        min-height: 0;
      }
      
      .content-columns {
        display: flex;
        flex: 1;
        gap: 12px;
        min-height: 0;
      }
      
      .assessment-column {
        flex: 1 1 0;
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      
      .body-diagram-column {
        flex: 0 0 180px;
        display: flex;
        justify-content: flex-end;
        align-items: flex-start;
      }
      
      /* Body Diagram */
      .body-diagram {
        background-image: url('${bodyBase64}');
        background-size: contain;
        background-repeat: no-repeat;
        background-position: center;
        width: 180px;
        height: 170px;
      }
      
      /* Assessment Fields */
      .assessment-section {
        flex-shrink: 0;
      }
      
      .section-label {
        font-weight: 600;
        margin-bottom: 4px;
        color: #2c3e50;
        font-size: 12px;
        padding-bottom: 2px;
        border-bottom: 1px solid #3498db;
        display: inline-block;
      }
      
      .section-content {
        margin-top: 4px;
        padding: 4px 0;
        font-size: 11px;
        line-height: 1.5;
        color: #2c3e50;
        min-height: 30px;
        max-height: 80px;
        overflow: hidden;
        background: transparent;
        border: none;
        white-space: pre-wrap;
        word-wrap: break-word;
      }
      
      /* Signature Section */
      .signature-section {
        position: absolute;
        bottom: 18mm;
        right: 0;
        text-align: right;
      }
      
      .signature-text {
        font-style: italic;
        margin-bottom: 4px;
        color: #6c757d;
        font-size: 11px;
      }
      
      .signature-line {
        border-bottom: 1px solid #495057;
        width: 130px;
        margin: 10px 0 4px auto;
      }
      
      .signature-name {
        font-size: 10px;
        margin-top: 4px;
        color: #495057;
        font-weight: 500;
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
        font-size: 11px;
        font-weight: 600;
        border-radius: 4px;
        letter-spacing: 0.3px;
      }
      
      /* Logo Watermark */
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
      
      .fallback-logo {
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
        <div class="clinic-info">
          <div class="logo">
            ${
              logoBase64
                ? `<img class="logo-image" src="${logoBase64}" alt="Thera-Cure Logo" />`
                : `<div class="logo-fallback">TC</div>`
            }
          </div>
          <div class="contact-info">
            <p><strong>ADDRESS:</strong> 361/A, BASUDEVPUR ROAD, GROUND FLOOR - 'NILANJANA' APARTMENT, SHYAMNAGAR, NORTH 24 PARGANAS, PIN - 743127</p>
            <p><strong>Tel:</strong> (033) 3564 7255</p>
            <p><strong>Email:</strong> contacts@mstheracure.com</p>
            <p><strong>Website:</strong> www.mstheracure.com</p>
            <p style="margin-top: 3px; font-weight: bold;">Time: Monday to Saturday (9:00 AM to 7:00 PM)</p>
            <p style="font-weight: bold; color: #e74c3c;">SUNDAY CLOSED</p>
          </div>
        </div>
        
        <div class="doctor-info">
          <div class="doctor-name">
            ${
              therapist?.user?.name ||
              therapist?.name ||
              "Dr. Diksha Palit (PT)"
            }
          </div>
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
      
      <!-- Patient Information -->
      <div class="patient-info-container">
        <div class="patient-info">
          <div class="patient-info-title">Patient Information</div>
          <div class="patient-grid">
            <div class="patient-field">
              <span class="patient-field-label">Name:</span>
              <span class="patient-field-value">
                ${
                  patientInfo?.patientName ||
                  patientInfo?.name ||
                  assessmentData?.patientName ||
                  "N/A"
                }
              </span>
            </div>
            <div class="patient-field">
              <span class="patient-field-label">Age:</span>
              <span class="patient-field-value">
                ${patientInfo?.age || assessmentData?.age || "N/A"} years
              </span>
            </div>
            <div class="patient-field">
              <span class="patient-field-label">Gender:</span>
              <span class="patient-field-value">
                ${patientInfo?.gender || assessmentData?.gender || "N/A"}
              </span>
            </div>
            <div class="patient-field">
              <span class="patient-field-label">Height:</span>
              <span class="patient-field-value">
                ${patientInfo?.height || assessmentData?.height || "N/A"} cms
              </span>
            </div>
            <div class="patient-field">
              <span class="patient-field-label">Weight:</span>
              <span class="patient-field-value">
                ${patientInfo?.weight || assessmentData?.weight || "N/A"} kgs
              </span>
            </div>
            <div class="patient-field">
              <span class="patient-field-label">Patient ID:</span>
              <span class="patient-field-value">
                ${
                  patientInfo?.id ||
                  patientInfo?.patientId ||
                  assessmentData?.patientId ||
                  "N/A"
                }
              </span>
            </div>
            <div class="patient-field">
              <span class="patient-field-label">Date:</span>
              <span class="patient-field-value">
                ${
                  assessmentData?.assessmentDate || assessmentData?.createdAt
                    ? new Date(
                        assessmentData.assessmentDate ||
                          assessmentData.createdAt
                      ).toLocaleDateString("en-IN")
                    : new Date().toLocaleDateString("en-IN")
                }
              </span>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Content Container -->
      <div class="content-container">
        <div class="content-columns">
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

          <!-- Middle Column -->
          <div class="assessment-column">
            ${renderSection("On Examinations", assessmentData?.onExaminations)}
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

          <!-- Right Column: Body Diagram -->
          <div class="body-diagram-column">
            <div class="body-diagram"></div>
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
