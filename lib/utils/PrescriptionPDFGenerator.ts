import puppeteer from "puppeteer";
import path from "path";
import { fileURLToPath } from "url";
import { getImagesAsBase64 } from "./imageUtils.node";
import { calculateSimpleBMI } from "@/lib/utils/bmi-claculator";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const generateAssessmentPDF = async (assessment: any) => {
  const { patientInfo, therapist, assessmentData } = assessment;

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
      timeout: 30000,
    });

    const page = await browser.newPage();
    page.setDefaultTimeout(30000);

    const images = await getImagesAsBase64([
      "apple-touch-icon.png",
      "humen-body.jpg",
    ]);

    const logoBase64 = images["apple-touch-icon.png"];
    const bodyBase64 = images["humen-body.jpg"];

    // --- Helper Functions ---
    const hasValue = (value: any): boolean => {
      if (value === null || value === undefined) return false;
      if (typeof value === "string") return value.trim() !== "";
      if (typeof value === "number") return value !== 0;
      if (typeof value === "object") {
        if (Array.isArray(value)) return value.length > 0;
        return Object.values(value).some((v) => hasValue(v));
      }
      return Boolean(value);
    };

    // Helper to format keys like "vasScore" -> "VAS Score" or "rom" -> "ROM"
    const formatKey = (key: string) => {
      const upperKeys = ["rom", "arom", "prom", "vas", "hmf", "bp", "spo2"];

      // Check if the key starts with any of the upperKeys
      for (const k of upperKeys) {
        if (key.toLowerCase().startsWith(k)) {
          return key
            .replace(new RegExp(k, "i"), k.toUpperCase())
            .replace(/([A-Z])/g, " $1")
            .trim();
        }
      }
      // Default: camelCase to Title Case
      return key
        .replace(/([A-Z])/g, " $1")
        .replace(/^./, (str) => str.toUpperCase())
        .trim();
    };

    const renderSection = (label: string, value: any, fullWidth = false) => {
      if (!hasValue(value)) return "";

      let contentHtml = "";

      if (typeof value === "string" || typeof value === "number") {
        contentHtml = `<div class="val-text">${value}</div>`;
      } else if (typeof value === "object" && !Array.isArray(value)) {
        const items = Object.entries(value)
          .filter(([k, v]) => hasValue(v))
          .map(
            ([k, v]) => `
            <div class="sub-item">
              <span class="sub-key">${formatKey(k)}:</span>
              <span class="sub-val">${typeof v === 'object' ? JSON.stringify(v) : v}</span>
            </div>
          `
          )
          .join("");

        if (!items) return "";
        contentHtml = `<div class="val-list ${fullWidth ? 'horizontal-list' : ''}">${items}</div>`;
      } else {
        return "";
      }

      return `
      <div class="section-block">
        <div class="sec-title">${label}</div>
        <div class="sec-content">${contentHtml}</div>
      </div>`;
    };

    const renderVitalsText = () => {
      const vitals = assessmentData?.vitals;
      if (!vitals) return "";

      let parts = "";
      if (vitals.bloodPressure?.systolic)
        parts += `<div class="sub-item"><span class="sub-key">BP:</span> <span class="sub-val">${vitals.bloodPressure.systolic}/${vitals.bloodPressure.diastolic}</span></div>`;
      if (vitals.pulse)
        parts += `<div class="sub-item"><span class="sub-key">Pulse:</span> <span class="sub-val">${vitals.pulse} bpm</span></div>`;
      if (vitals.temperature)
        parts += `<div class="sub-item"><span class="sub-key">Temp:</span> <span class="sub-val">${vitals.temperature}°F</span></div>`;
      if (vitals.spo2)
        parts += `<div class="sub-item"><span class="sub-key">SPO2:</span> <span class="sub-val">${vitals.spo2}%</span></div>`;

      if (!parts) return "";
      return parts;
    };

    const renderExaminationSection = () => {
       const vitalsHtml = renderVitalsText();
       const motor = assessmentData?.motorExamination;
       const neuro = assessmentData?.neurologicalExam || assessmentData?.neurologicalExamination;

       // Check if there is anything to render
       const hasVitals = !!vitalsHtml;
       const hasMotor = hasValue(motor);
       const hasNeuro = hasValue(neuro);

       if (!hasVitals && !hasMotor && !hasNeuro) return "";

       let content = "";
       if (hasVitals) {
           content += `<div class="exam-sub-group"><div class="exam-sub-title">Vitals</div><div class="val-list horizontal-list">${vitalsHtml}</div></div>`;
       }

       if (hasMotor) {
         // Re-use render logic for objects but inline
         const items = Object.entries(motor)
          .filter(([_, v]) => hasValue(v))
          .map(([k, v]) => `<div class="sub-item"><span class="sub-key">${formatKey(k)}:</span><span class="sub-val">${v}</span></div>`)
          .join("");
         if (items) content += `<div class="exam-sub-group"><div class="exam-sub-title">Motor Examination</div><div class="val-list horizontal-list">${items}</div></div>`;
       }

       if (hasNeuro) {
         const items = Object.entries(neuro)
          .filter(([_, v]) => hasValue(v))
          .map(([k, v]) => `<div class="sub-item"><span class="sub-key">${formatKey(k)}:</span><span class="sub-val">${v}</span></div>`)
          .join("");
         if (items) content += `<div class="exam-sub-group"><div class="exam-sub-title">Neurological Examination</div><div class="val-list horizontal-list">${items}</div></div>`;
       }

       return `
        <div class="section-block">
          <div class="sec-title">On Examination</div>
          <div class="sec-content">${content}</div>
        </div>`;
    };

    const renderBMIChart = () => {
      const vitals = assessmentData?.vitals;
      let bmiValue = vitals?.bmi;

      if (!bmiValue && vitals?.weight && vitals?.height) {
        const calculated = calculateSimpleBMI(vitals.weight, vitals.height);
        if (calculated) bmiValue = calculated.bmi;
      }

      if (!bmiValue) return "";

      const minScale = 15;
      const maxScale = 40;
      const positionPercent = Math.min(
        100,
        Math.max(0, ((bmiValue - minScale) / (maxScale - minScale)) * 100)
      );

      return `
        <div class="bmi-container">
           <div class="bmi-title">BMI Index: ${bmiValue} kg/m²</div>
           <div class="bmi-bar">
              <div class="bmi-segment seg-under" style="width: 14%;"></div>
              <div class="bmi-segment seg-normal" style="width: 26%;"></div>
              <div class="bmi-segment seg-over" style="width: 20%;"></div>
              <div class="bmi-segment seg-obese" style="width: 40%;"></div>
              <div class="bmi-pointer" style="left: ${positionPercent}%;">
                 <div class="arrow-down">▼</div>
              </div>
           </div>
           <div class="bmi-labels">
              <span>Under</span>
              <span>Normal</span>
              <span>Over</span>
              <span>Obese</span>
           </div>
        </div>
      `;
    };
    
    const renderPainHistoryWithVAS = (painHistory: any) => {
        if (!hasValue(painHistory)) return "";

        let contentHtml = "";

        // Render basic pain history fields (excluding vasScores)
        const items = Object.entries(painHistory)
          .filter(([k, v]) => {
            if (k === 'vasScores') return false;
            return hasValue(v);
          })
          .map(
            ([k, v]) => `
            <div class="sub-item">
              <span class="sub-key">${formatKey(k)}:</span>
              <span class="sub-val">${typeof v === 'object' ? JSON.stringify(v) : v}</span>
            </div>
          `
          )
          .join("");

        if (items) {
          contentHtml = `<div class="val-list">${items}</div>`;
        }

        // Add VAS scores table if available
        const vasScores = painHistory?.vasScores;
        if (Array.isArray(vasScores) && vasScores.length > 0) {
            const tableRows = vasScores
                .map((entry: any) => `
                    <tr>
                        <td>${entry.location || '-'}</td>
                        <td>${entry.activity || '-'}</td>
                        <td>${entry.timeOfDay || '-'}</td>
                        <td class="score-cell">${entry.vasScore}/10</td>
                    </tr>
                `)
                .join('');

            const vasTable = `
                <div class="vas-table-container" style="margin-top: 8px;">
                    <div class="vas-table-title">VAS Pain Scores</div>
                    <table class="vas-table">
                        <thead>
                            <tr>
                                <th>Location</th>
                                <th>Activity</th>
                                <th>Time</th>
                                <th>Score</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${tableRows}
                        </tbody>
                    </table>
                </div>
            `;

            contentHtml += vasTable;
        }

        if (!contentHtml) return "";

        return `
          <div class="section-block">
            <div class="sec-title">Pain History</div>
            <div class="sec-content">${contentHtml}</div>
          </div>`;
    };

    // --- HTML Template ---
    const htmlTemplate = `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="UTF-8">
    <title>OPD Assessment Sheet</title>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700;900&display=swap');
      @page { size: A4; margin: 6mm 8mm 10mm 8mm; }
      * { box-sizing: border-box; }
      body {
        font-family: 'Roboto', sans-serif;
        font-size: 9.5pt;
        color: #000;
        margin: 0; padding: 0;
        line-height: 1.25;
      }
      /* Watermark */
      .watermark {
        position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
        width: 60%; max-width: 500px; opacity: 0.08; z-index: -1000; filter: grayscale(100%);
      }
      
      /* Header */
      .header-wrapper { display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 5px; border-bottom: 2px solid #00aeef; margin-bottom: 8px; }
      .header-left { width: 55%; display: flex; flex-direction: column; align-items: flex-start; }
      .logo-img { width: 280px; max-width: 100%; height: auto; object-fit: contain; display: block; margin-bottom: 5px; }
      
      .clinic-address-block { font-size: 8pt; color: #444; text-align: left; line-height: 1.35; margin-left: 2px; }
      .address-line { display: block; font-weight: 500; }
      .info-line { display: block; margin-top: 1px; }
      .info-label { font-weight: 600; color: #222; }

      /* Doctor Info */
      .header-right { width: 45%; display: flex; flex-direction: column; align-items: flex-start; text-align: left; padding-top: 5px; }
      .dr-block { display: flex; flex-direction: column; gap: 2px; width: 100%; }
      .dr-line-1 { font-size: 16pt; font-weight: 900; color: #ed1c24; line-height: 1.1; } /* Name */
      .dr-line-2 { font-size: 9pt; font-weight: 700; color: #0054a6; } /* Reg No */
      .dr-line-3 { font-size: 9pt; font-weight: 600; color: #2e7d32; } /* Degrees */
      .dr-line-4 { font-size: 8.5pt; font-weight: 500; color: #e65100; } /* Present Pos */
      .dr-line-5 { font-size: 8pt; font-style: italic; color: #6a1b9a; } /* Prev Pos */

      /* Title */
      .sheet-title { text-align: center; margin: 5px 0 10px 0; }
      .title-badge { background-color: #1a237e; color: white; padding: 3px 20px; border-radius: 12px; font-weight: bold; font-size: 10pt; text-transform: uppercase; }

      /* Patient Grid */
      .patient-grid { display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 9pt; background: #f8f9fa; padding: 6px; border: 1px solid #ddd; border-radius: 4px; }
      .pg-col { width: 49%; display: flex; flex-direction: column; gap: 4px; }
      .info-row { display: flex; align-items: baseline; }
      .p-label { color: #0054a6; font-weight: 700; min-width: 75px; font-size: 8.5pt; }
      .p-val { flex: 1; border-bottom: 1px dotted #ccc; color: #000; padding-left: 5px; font-weight: 500; }

      /* Layout Containers */
      .main-container { display: flex; flex-direction: column; gap: 8px; }
      
      /* History & Image Section */
      .history-section-wrapper { display: flex; gap: 15px; }
      .history-text-col { width: 70%; display: flex; flex-direction: column; gap: 8px; }
      .history-img-col { width: 30%; display: flex; flex-direction: column; align-items: center; justify-content: flex-start; padding-top: 20px; }

      /* Sections */
      .section-block { margin-bottom: 8px; width: 100%; }
      .sec-title { color: #0054a6; font-weight: 700; font-size: 9.5pt; margin-bottom: 2px; text-transform: uppercase; border-bottom: 1px solid #e0e0e0; display: inline-block; padding-bottom: 1px; }
      .sec-content { font-size: 9pt; color: #333; padding-left: 2px; margin-top: 2px; }
      
      .val-list { display: flex; flex-direction: column; gap: 1px; }
      .horizontal-list { flex-direction: row; flex-wrap: wrap; gap: 12px; }
      .sub-item { display: flex; align-items: baseline; }
      .sub-key { font-weight: 600; color: #555; margin-right: 4px; font-size: 8.5pt; }
      .sub-val { font-size: 9pt; }
      .val-text { white-space: pre-wrap; line-height: 1.3; text-align: justify; }

      /* Examination Subgroups */
      .exam-sub-group { margin-bottom: 4px; }
      .exam-sub-title { font-size: 8.5pt; font-weight: 600; color: #444; text-decoration: underline; margin-bottom: 2px; }

      /* Images */
      .body-img { width: 100%; max-width: 130px; opacity: 0.95; margin-bottom: 8px; }
      .diag-labels { display: flex; justify-content: space-between; width: 100%; max-width: 130px; font-size: 7pt; font-weight: bold; margin-bottom: 2px; }

      /* BMI & VAS */
      .bmi-container { width: 100%; margin-top: 5px; padding: 4px; border: 1px solid #eee; border-radius: 4px; background: #fff; }
      .bmi-title { font-size: 8pt; font-weight: bold; color: #333; text-align: center; margin-bottom: 2px; }
      .bmi-bar { display: flex; height: 10px; width: 100%; border-radius: 5px; overflow: hidden; position: relative; margin-bottom: 2px; }
      .bmi-segment { height: 100%; }
      .seg-under { background: #f97316; } .seg-normal { background: #16a34a; } .seg-over { background: #eab308; } .seg-obese { background: #dc2626; }
      .bmi-pointer { position: absolute; top: -5px; transform: translateX(-50%); color: #000; font-size: 7px; font-weight: bold; }
      .bmi-labels { display: flex; justify-content: space-between; font-size: 5px; color: #666; text-transform: uppercase; font-weight: 600; }

      .vas-box { width: 100%; text-align: center; margin-top: 8px; padding: 4px; background: #ffebee; border-radius: 4px; font-size: 9pt; color: #c62828; border: 1px solid #ffcdd2; }

      /* VAS Table */
      .vas-table-container { width: 100%; margin-top: 8px; border: 1px solid #ddd; border-radius: 4px; overflow: hidden; background: #fff; }
      .vas-table-title { font-size: 8pt; font-weight: bold; color: #fff; background: #c62828; padding: 3px 6px; text-align: center; }
      .vas-table { width: 100%; border-collapse: collapse; font-size: 7.5pt; }
      .vas-table thead { background: #f5f5f5; }
      .vas-table th { padding: 3px 4px; text-align: left; font-weight: 600; color: #444; border-bottom: 2px solid #ddd; font-size: 7pt; }
      .vas-table td { padding: 3px 4px; border-bottom: 1px solid #eee; color: #333; }
      .vas-table tbody tr:last-child td { border-bottom: none; }
      .vas-table .score-cell { font-weight: bold; color: #c62828; text-align: center; }

      /* Footer Elements */
      .signature-img { height: 40px; width: auto; max-width: 120px; display: block; margin-left: auto; margin-right: 0; }
    </style>
  </head>
  <body>
    ${logoBase64 ? `<img class="watermark" src="${logoBase64}" />` : ""}
    <div class="page">
      <div class="header-wrapper">
        <div class="header-left">
          ${logoBase64 ? `<img class="logo-img" src="${logoBase64}" />` : ""}
          <div class="clinic-address-block">
             <span class="address-line">361/A, Basudevpur Road, Ground Floor</span>
            <span class="address-line">'Nilanjana' Apartment, Shyamnagar</span>
            <span class="address-line">24 Pgs (N), Pin - 743127</span>
            <span class="info-line"><span class="info-label">Email:</span> contacts@mstheracure.com</span>
            <span class="info-line"><span class="info-label">Web:</span> www.mstheracure.com</span>
            <span class="info-line"><span class="info-label">Time:</span> Mon to Sat (9:00 AM - 8:00 PM)</span>
            <span class="info-line"><span class="info-label">Ph:</span> 033-3564-7255 | 6290926667</span>
          </div>
        </div>
        <div class="header-right">
          <div class="dr-block">
             <div class="dr-line-1">${
               therapist?.user?.name || therapist?.name || "Dr. Diksha Palit (PT)"
             }</div>
             <div class="dr-line-2">Reg No: ${therapist?.regNo || "L-48489"}</div>
             <div class="dr-line-3">${
               therapist?.qualification || "B.P.T [W.B.U.H.S], CDNT"
             }</div>
             <div class="dr-line-4">${
                therapist?.specialization?.split(',')[0] || "Co-Founder & Consultant Physiotherapist"
             }</div>
             <div class="dr-line-5">${
                therapist?.experiences || (therapist?.specialization?.includes(',') ? "Ex-Intern Physiotherapist of Belle Vue Clinic" : "")
             }</div>
          </div>
        </div>
      </div>

      <div class="sheet-title"><span class="title-badge">OPD ASSESSMENT SHEET</span></div>

      <div class="patient-grid">
        <div class="pg-col">
          <div class="info-row"><span class="p-label">Name:</span><span class="p-val">${
            patientInfo?.patientName ||
            patientInfo?.name ||
            assessmentData?.patientName ||
            ""
          }</span></div>
          <div class="info-row"><span class="p-label">Age / Sex:</span><span class="p-val">${
            patientInfo?.age || assessmentData?.age || ""
          } / ${
      patientInfo?.gender || assessmentData?.gender || ""
    }</span></div>
          <div class="info-row"><span class="p-label">Chief C/O:</span><span class="p-val">${
            assessmentData?.chiefComplaints || ""
          }</span></div>
        </div>
        <div class="pg-col">
          <div class="info-row"><span class="p-label">Patient ID:</span><span class="p-val">${
            assessmentData?.patientId || patientInfo?.patientId || "THRC"
          }</span></div>
          <div class="info-row"><span class="p-label">Date:</span><span class="p-val">${new Date(
            assessmentData?.assessmentDate || Date.now()
          ).toLocaleDateString("en-IN")}</span></div>
          <div class="info-row"><span class="p-label">Ht / Wt:</span><span class="p-val">${
            assessmentData?.vitals?.height || patientInfo?.height || "__"
          } cm | ${
      assessmentData?.vitals?.weight || patientInfo?.weight || "__"
    } kg</span></div>
        </div>
      </div>

      <div class="main-container">
          <!-- History and Image Row -->
          <div class="history-section-wrapper">
             <div class="history-text-col">
                ${renderSection(
                  "History",
                  assessmentData?.historyOfPresentIllness ||
                    assessmentData?.historyOfIllness
                )}
                ${renderSection("Medical History", assessmentData?.medicalHistory)}
                ${renderSection("Surgical History", assessmentData?.surgicalHistory)}
                ${renderSection("Occupational History", assessmentData?.occupationalHistory)}
                ${renderSection("Environmental History", assessmentData?.environmentalHistory)}
                ${renderPainHistoryWithVAS(assessmentData?.painHistory)}
             </div>
             <div class="history-img-col">
                 ${
                   bodyBase64
                     ? `<div class="diag-labels"><span>R</span> <span>L</span> <span>L</span> <span>R</span></div><img src="${bodyBase64}" class="body-img" />`
                     : ""
                 }
                 ${renderBMIChart()}
             </div>
          </div>

          <!-- Other Sections -->
          ${renderSection("On Observation", assessmentData?.onObservation, true)}
          ${renderSection("On Palpation", assessmentData?.onPalpation, true)}
          ${renderExaminationSection()}
          ${renderSection("Differential Diagnosis", assessmentData?.differentialDiagnosis)}
          ${renderSection("Investigations", assessmentData?.investigations)}
          ${renderSection("Special Tests", assessmentData?.specialTests)}
          ${renderSection("Provisional Diagnosis", assessmentData?.provisionalDiagnosis)}
          ${renderSection("Physiotherapy Management", assessmentData?.physiotherapyMgmt)}
          ${renderSection("Additional Notes", assessmentData?.notes)}
      </div>
    </div>
  </body>
  </html>
  `;

    await page.setContent(htmlTemplate, {
      waitUntil: "networkidle0",
      timeout: 30000,
    });

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "6mm", right: "8mm", bottom: "12mm", left: "8mm" },
      displayHeaderFooter: true,
      headerTemplate: "<div></div>",
      footerTemplate: `
        <div style="width: 100%; font-size: 10px; font-family: 'Roboto', sans-serif; padding-right: 8mm; padding-left: 8mm;">
          <div style="display: flex; justify-content: flex-end; align-items: flex-end; margin-bottom: 10px;">
             <div style="text-align: right;">
                 <!-- Digital Signature Placeholder -->
                 <div style="font-family: 'Dancing Script', cursive; font-size: 20px; color: #000; margin-bottom: 2px;">
                    ${therapist?.user?.name || therapist?.name || "Signature"}
                 </div>
                 <div style="border-top: 1px solid #000; width: 150px; display: inline-block;"></div>
                 <div style="font-size: 8px; font-weight: bold; margin-top: 1px;">DIGITAL SIGNATURE</div>
             </div>
          </div>
          <div style="text-align: center; margin-bottom: 5px; font-weight: bold; font-size: 10pt; color: #333;">
             --- End of Prescription ---
          </div>
          <div style="background-color: #ed1c24; color: white; text-align: center; padding: 4px; font-weight: bold; font-size: 8px; -webkit-print-color-adjust: exact; border-radius: 2px;">
            IN CASE OF ANY EMERGENCY CONTACT THE NEAREST HOSPITAL IMMEDIATELY
          </div>
        </div>
      `,
    });

    return pdfBuffer;
  } catch (error) {
    console.error("Assessment PDF generation error:", error);
    throw new Error(
      `Failed to generate assessment PDF: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  } finally {
    if (browser) await browser.close();
  }
};

export default generateAssessmentPDF;
