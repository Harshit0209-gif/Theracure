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

const generateAssessmentPDF = async (assessment: any) => {
	const browser = await puppeteer.launch({
		headless: true,
		args: ["--no-sandbox", "--disable-setuid-sandbox"],
	});
	const page = await browser.newPage();

	// Get the logo as base64
	const logoBase64 = await getImageAsBase64();

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
          margin: 0;
        }
        
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: Arial, sans-serif;
          font-size: 11px;
          line-height: 1.3;
          color: #000;
          background: white;
          width: 210mm;
          min-height: 297mm;
          position: relative;
        }
        
        .page {
          padding: 15mm 10mm;
          position: relative;
          min-height: 297mm;
        }
        
        /* Header Section */
        .header {
          display: flex;
          align-items: flex-start;
          margin-bottom: 15px;
          border-bottom: 2px solid #4a90e2;
          padding-bottom: 10px;
        }
        
        .logo-section {
          width: 80px;
          margin-right: 15px;
          flex-shrink: 0;
        }
        
        
        
        .logo-image {
          width: 70px;
          height: 70px;
          object-fit: contain;
          display: block;
        }
        
        .logo-fallback {
          width: 70px;
          height: 70px;
          background: linear-gradient(135deg, #4a90e2, #357abd);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: bold;
          font-size: 16px;
        }
        
        .clinic-info {
          flex: 1;
        }
        
        .clinic-name {
          font-size: 26px;
          font-weight: bold;
          color: #4a90e2;
          margin-bottom: 2px;
          letter-spacing: 1px;
        }
        
        .clinic-subtitle {
          font-size: 12px;
          color: #666;
          margin-bottom: 8px;
          font-style: italic;
        }
        
        .contact-info {
          font-size: 9px;
          line-height: 1.2;
          color: #333;
        }
        
        .contact-info p {
          margin-bottom: 2px;
        }
        
        .doctor-info {
          width: 300px;
          flex-shrink: 0;
          text-align: right;
          font-size: 10px;
        }
        
        .doctor-name {
          font-size: 18px;
          font-weight: bold;
          color: #d32f2f;
          margin-bottom: 3px;
        }
        
        .doctor-qualifications {
          font-size: 8px;
          line-height: 1.1;
          color: #555;
          margin-bottom: 3px;
        }
        
        .doctor-details {
          font-size: 8px;
          line-height: 1.1;
          color: #666;
        }
        
        /* Form Title */
        .form-title {
          background: #4a90e2;
          color: white;
          text-align: center;
          padding: 8px;
          font-size: 14px;
          font-weight: bold;
          margin: 15px 0;
          border-radius: 3px;
        }
        
        /* Patient Info Section */
        .patient-info {
          display: flex;
          justify-content: space-between;
          margin-bottom: 20px;
          font-size: 11px;
        }
        
        .patient-left {
          display: flex;
          justify-content: space-between;
          margin-bottom: 20px;
          font-size: 11px;
          gap:12px;
          flex-wrap:wrap;
        }
        
        .patient-right {
          width: 200px;
          text-align: right;
        }
        
        .field-group {
          display: flex;
          align-items: center;
          margin-bottom: 8px;
          width:calc(33% - 8px)
        }
        
        .field-label {
          font-weight: bold;
          margin-right: 10px;
          min-width: 80px;
        }
        
        .field-value {
          border-bottom: 1px solid #ccc;
          padding: 2px 5px;
          flex: 1;
          min-height: 18px;
        }
        
        /* Body Diagram */
        .body-diagram-container {
          position: absolute;
          right: 30mm;
          top: 130mm;
          width: 80px;
          height: 150px;
          opacity: 0.1;
          z-index: 0;
        }
        
        .body-diagrams {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
        }
        
        .diagram {
          width: 35px;
          height: 140px;
          position: relative;
        }
        
        .diagram-label {
          text-align: center;
          font-size: 8px;
          margin-bottom: 5px;
          font-weight: bold;
        }
        
        .human-figure {
          width: 100%;
          height: 130px;
          background-image: url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzUiIGhlaWdodD0iMTMwIiB2aWV3Qm94PSIwIDAgMzUgMTMwIiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8cGF0aCBkPSJNMTcuNSAyMEMxOS45ODUzIDIwIDIyIDIyLjAxNDcgMjIgMjQuNUMyMiAyNi45ODUzIDE5Ljk4NTMgMjkgMTcuNSAyOUMxNS4wMTQ3IDI5IDEzIDI2Ljk4NTMgMTMgMjQuNUMxMyAyMi4wMTQ3IDE1LjAxNDcgMjAgMTcuNSAyMFoiIHN0cm9rZT0iIzMzMyIgc3Ryb2tlLXdpZHRoPSIxIiBmaWxsPSJub25lIi8+CjxwYXRoIGQ9Ik0xNy41IDI5VjYwIiBzdHJva2U9IiMzMzMiIHN0cm9rZS13aWR0aD0iMSIvPgo8cGF0aCBkPSJNOCAzNUwxNy41IDMwTDI3IDM1IiBzdHJva2U9IiMzMzMiIHN0cm9rZS13aWR0aD0iMSIgZmlsbD0ibm9uZSIvPgo8cGF0aCBkPSJNMTcuNSA2MEw5IDkwIiBzdHJva2U9IiMzMzMiIHN0cm9rZS13aWR0aD0iMSIvPgo8cGF0aCBkPSJNMTcuNSA2MEwyNiA5MCIgc3Ryb2tlPSIjMzMzIiBzdHJva2Utd2lkdGg9IjEiLz4KPHA+tnMgZD0iTTkgOTBMNyAxMjAiIHN0cm9rZT0iIzMzMyIgc3Ryb2tlLXdpZHRoPSIxIi8+CjxwYXRoIGQ9Ik05IDkwTDExIDEyMCIgc3Ryb2tlPSIjMzMzIiBzdHJva2Utd2lkdGg9IjEiLz4KPHA+tnMgZD0iTTI2IDkwTDI0IDEyMCIgc3Ryb2tlPSIjMzMzIiBzdHJva2Utd2lkdGg9IjEiLz4KPHA+tnMgZD0iTTI2IDkwTDI4IDEyMCIgc3Ryb2tlPSIjMzMzIiBzdHJva2Utd2lkdGg9IjEiLz4KPC9zdmc+');
          background-repeat: no-repeat;
          background-position: center;
          background-size: contain;
        }
        
        /* Assessment Fields */
        .assessment-section {
          margin-bottom: 15px;
          position: relative;
          z-index: 1;
        }
        
        .section-label {
          font-weight: bold;
          margin-bottom: 3px;
          color: #333;
        }
        
        .section-content {
          border: 1px solid #ddd;
          min-height: 40px;
          padding: 5px;
          background: white;
          font-size: 10px;
          line-height: 1.4;
        }
        
        .two-column {
          display: flex;
          gap: 15px;
        }
        
        .column {
          flex: 1;
        }
        
        /* Footer */
        .footer {
          position: absolute;
          bottom: 10mm;
          left: 10mm;
          right: 10mm;
          background: #4a90e2;
          color: white;
          text-align: center;
          padding: 8px;
          font-size: 11px;
          font-weight: bold;
          border-radius: 3px;
        }
        
        .signature-section {
          position: absolute;
          bottom: 25mm;
          right: 10mm;
          text-align: right;
        }
        
        .signature-line {
          border-bottom: 1px solid #333;
          width: 150px;
          margin: 20px 0 5px auto;
        }
        
        /* Watermark */
        .watermark {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%) rotate(-45deg);
          font-size: 60px;
          color: rgba(74, 144, 226, 0.05);
          font-weight: bold;
          z-index: 0;
          pointer-events: none;
        }
        
        @media print {
          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
        }
      </style>
    </head>
    <body>
      <div class="page">
        <!-- Watermark -->
        <div class="watermark">THERA-CURE</div>
        
        <!-- Header -->
        <div class="header" style="display:flex; flex-direction:row; justify-content:space-between; align-items:flex-start;">
          
          <div class="clinic-info" style="margin-top:-20px;">
            <div class="logo">
              ${
								logoBase64
									? `<img class="logo-image" src="${logoBase64}" alt="Thera-Cure Logo" style="width:140px; height:auto;"/>`
									: `<div class="logo-fallback">TC</div>`
							}
            </div>
            <div class="contact-info" style="width:200px;">
              <p><strong>ADDRESS:</strong> 361/A, BASUDEVPUR ROAD, GROUND FLOOR - 'NILANJANA' APARTMENT, SHYAMNAGAR, NORTH 24 PARGANAS, PIN - 743127</p>
              <p><strong>Tel:</strong> (033) 3564 7255</p>
              <p><strong>Email:</strong> contacts@mstheracure.com</p>
              <p><strong>Website:</strong> www.mstheracure.com</p>
              <p style="margin-top: 5px; font-weight: bold;">Time: Monday to Saturday (9:00 AM to 7:00 PM)</p>
              <p style="font-weight: bold; color: #d32f2f;">SUNDAY CLOSED</p>
            </div>
          </div>
          
          <div class="doctor-info">
            <div class="doctor-name">Dr. Diksha Palit (PT)</div>
            <div class="doctor-qualifications">
              B.P.T [W.B.U.H.S], CDNT<br>
              Co-Founder & Consultant Physiotherapist
            </div>
            <div class="doctor-details">
              Ex-Intern Physiotherapist of Belle Vue Clinic<br>
              Ex-Intern Physiotherapist of BM Birla Heart Research Centre<br>
              Ex-Intern Physiotherapist of Dr. B. C. Roy<br>
              Post Graduate Institute of Paediatric Science<br>
              Ex-Intern Physiotherapist of Woodlands Multispecialty Hospitals<br>
              Ex-Intern Physiotherapist of IPGME&R AND SSKM HOSPITAL
            </div>
          </div>
        </div>
        
        <!-- Form Title -->
        <div class="form-title">OPD ASSESSMENT SHEET</div>
        
        <!-- Patient Information -->
        <div class="patient-info">
          <div class="patient-left">
            <div class="field-group">
              <span class="field-label">Name:</span>
              <span class="field-value">${
								assessment.patient?.patientName || assessment.patientName || ""
							}</span>
            </div>
            <div class="field-group">
              <span class="field-label">Age:</span>
              <span class="field-value">${
								assessment.patient?.age || assessment.age || ""
							} </span>
            </div>
             <div class="field-group">
              <span class="field-label">Gender:</span>
              <span class="field-value">${
								assessment.patient?.gender || assessment.gender || ""
							}</span>
            </div>
            <div class="field-group">
              <span class="field-label">Height:</span>
              <span class="field-value">${assessment.height || ""} cms.</span>
            </div>
            <div class="field-group">
              <span class="field-label">Weight:</span>
              <span class="field-value">${assessment.weight || ""} kgs.</span>
            </div>
            
            <div class="field-group">
              <span class="field-label">Patient ID:</span>
              <span class="field-value">THRC${
								assessment.patient?.id || assessment.patientId || ""
							}</span>
            </div>
            <div class="field-group">
              <span class="field-label">Date:</span>
              <span class="field-value">${
								assessment.assessmentDate
									? new Date(assessment.assessmentDate).toLocaleDateString(
											"en-IN"
									  )
									: ""
							}</span>
            </div>
          </div>
          
        </div>
        
        <!-- Body Diagram Container -->
        <div class="body-diagram-container">
          <div class="body-diagrams">
            <div class="diagram">
              <div class="diagram-label">R</div>
              <div class="human-figure"></div>
            </div>
            <div class="diagram">
              <div class="diagram-label">L</div>
              <div class="human-figure"></div>
            </div>
            <div class="diagram">
              <div class="diagram-label">L</div>
              <div class="human-figure"></div>
            </div>
            <div class="diagram">
              <div class="diagram-label">R</div>
              <div class="human-figure"></div>
            </div>
          </div>
        </div>
        
        <!-- Assessment Sections -->
        <div class="assessment-section">
          <div class="section-label">Chief Complaints:</div>
          <div class="section-content">${assessment.chiefComplaints || ""}</div>
        </div>
        
        <div class="assessment-section">
          <div class="section-label">H/O:</div>
          <div class="section-content">${
						assessment.historyOfIllness || ""
					}</div>
        </div>
        
        <div class="two-column">
          <div class="column">
            <div class="assessment-section">
              <div class="section-label">On Observation:</div>
              <div class="section-content">${
								assessment.onObservation || ""
							}</div>
            </div>
          </div>
          <div class="column">
            <div class="assessment-section">
              <div class="section-label">On Palpation:</div>
              <div class="section-content">${assessment.onPalpation || ""}</div>
            </div>
          </div>
        </div>
        
        <div class="assessment-section">
          <div class="section-label">On Examinations:</div>
          <div class="section-content">${assessment.onExaminations || ""}</div>
        </div>
        
        <div class="two-column">
          <div class="column">
            <div class="assessment-section">
              <div class="section-label">Differential Diagnosis:</div>
              <div class="section-content">${
								assessment.differentialDiagnosis || ""
							}</div>
            </div>
          </div>
          <div class="column">
            <div class="assessment-section">
              <div class="section-label">Investigations:</div>
              <div class="section-content">${
								assessment.investigations || ""
							}</div>
            </div>
          </div>
        </div>
        
        <div class="assessment-section">
          <div class="section-label">Special Tests:</div>
          <div class="section-content">${assessment.specialTests || ""}</div>
        </div>
        
        <div class="assessment-section">
          <div class="section-label">Provisional Diagnosis:</div>
          <div class="section-content">${
						assessment.provisionalDiagnosis || ""
					}</div>
        </div>
        
        <div class="assessment-section">
          <div class="section-label">Physiotherapy Management:</div>
          <div class="section-content">${
						assessment.physiotherapyMgmt || ""
					}</div>
        </div>
        
        <!-- Signature Section -->
        <div class="signature-section">
          <div style="font-style: italic; margin-bottom: 5px;">Signature</div>
          <div class="signature-line"></div>
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
