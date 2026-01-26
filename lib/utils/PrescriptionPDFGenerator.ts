import puppeteer from "puppeteer";
import path from "path";
import { fileURLToPath } from "url";
import { getImagesAsBase64 } from "./imageUtils.node";
import { calculateSimpleBMI } from "@/lib/utils/bmi-claculator";
import { PUPPETEER_CONFIG } from "@/config/puppeteer.config";
import os from "os";
import fs from "fs/promises";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const generateAssessmentPDF = async (assessment: any) => {
  const { patientInfo, therapist, assessmentData } = assessment;

  let browser;
  let tmpDir: string | null = null;
  try {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "puppeteer-"));

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

    const images = await getImagesAsBase64([
      "apple-touch-icon.png",
      "humen-body.jpg",
    ]);

    const logoBase64 = images["apple-touch-icon.png"];
    const bodyBase64 = images["humen-body.jpg"];

    // --- Helper Functions (Same as before) ---
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

    const formatKey = (key: string) => {
      const upperKeys = ["rom", "arom", "prom", "vas", "hmf", "bp", "spo2"];
      for (const k of upperKeys) {
        if (key.toLowerCase().startsWith(k)) {
          return key
            .replace(new RegExp(k, "i"), k.toUpperCase())
            .replace(/([A-Z])/g, " $1")
            .trim();
        }
      }
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
              <span class="sub-val">${
                typeof v === "object" ? JSON.stringify(v) : v
              }</span>
            </div>
          `,
          )
          .join("");

        if (!items) return "";
        contentHtml = `<div class="val-list ${
          fullWidth ? "horizontal-list" : ""
        }">${items}</div>`;
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
      return parts;
    };

    const renderExaminationSection = () => {
      const vitalsHtml = renderVitalsText();
      const motor = assessmentData?.motorExamination;
      const neuro =
        assessmentData?.neurologicalExam ||
        assessmentData?.neurologicalExamination;

      const hasVitals = !!vitalsHtml;
      const hasMotor = hasValue(motor);
      const hasNeuro = hasValue(neuro);

      if (!hasVitals && !hasMotor && !hasNeuro) return "";

      let content = "";
      if (hasVitals) {
        content += `<div class="exam-sub-group"><div class="exam-sub-title">Vitals</div><div class="val-list horizontal-list">${vitalsHtml}</div></div>`;
      }
      if (hasMotor) {
        const items = Object.entries(motor)
          .filter(([_, v]) => hasValue(v))
          .map(
            ([k, v]) =>
              `<div class="sub-item"><span class="sub-key">${formatKey(
                k,
              )}:</span><span class="sub-val">${v}</span></div>`,
          )
          .join("");
        if (items)
          content += `<div class="exam-sub-group"><div class="exam-sub-title">Motor Examination</div><div class="val-list horizontal-list">${items}</div></div>`;
      }
      if (hasNeuro) {
        const items = Object.entries(neuro)
          .filter(([_, v]) => hasValue(v))
          .map(
            ([k, v]) =>
              `<div class="sub-item"><span class="sub-key">${formatKey(
                k,
              )}:</span><span class="sub-val">${v}</span></div>`,
          )
          .join("");
        if (items)
          content += `<div class="exam-sub-group"><div class="exam-sub-title">Neurological Examination</div><div class="val-list horizontal-list">${items}</div></div>`;
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
        Math.max(0, ((bmiValue - minScale) / (maxScale - minScale)) * 100),
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
              <span>Under</span><span>Normal</span><span>Over</span><span>Obese</span>
           </div>
        </div>
      `;
    };

    const renderPainHistoryWithVAS = (painHistory: any) => {
      if (!hasValue(painHistory)) return "";

      let contentHtml = "";

      // 1. Render basic pain history text fields first
      const items = Object.entries(painHistory)
        .filter(([k, v]) => {
          if (k === "vasScores") return false;
          return hasValue(v);
        })
        .map(
          ([k, v]) => `
            <div class="sub-item">
              <span class="sub-key">${formatKey(k)}:</span>
              <span class="sub-val">${
                typeof v === "object" ? JSON.stringify(v) : v
              }</span>
            </div>
          `,
        )
        .join("");

      if (items) {
        contentHtml = `<div class="val-list">${items}</div>`;
      }

      // 2. Render the Visual VAS Table
      const vasScores = painHistory?.vasScores;
      if (Array.isArray(vasScores) && vasScores.length > 0) {
        // Helper to get color based on score
        const getPainColor = (score: number) => {
          if (score <= 3) return "#22c55e"; // Green (Mild)
          if (score <= 6) return "#eab308"; // Yellow/Orange (Moderate)
          return "#ef4444"; // Red (Severe)
        };

        const tableRows = vasScores
          .map((entry: any) => {
            const score = parseInt(entry.vasScore) || 0;
            const color = getPainColor(score);
            const percent = (score / 10) * 100;

            return `
              <tr class="vas-row">
                  <td class="vas-cell" style="font-weight:500;">${entry.location || "-"}</td>
                  <td class="vas-cell">${entry.activity || "-"}</td>
                  <td class="vas-cell">${entry.timeOfDay || "-"}</td>
                  <td class="vas-cell" style="width: 120px;">
                    <div class="vas-visual-container">
                      <div class="vas-bar-bg">
                        <div class="vas-bar-fill" style="width: ${percent}%; background-color: ${color};"></div>
                      </div>
                      <span class="vas-badge" style="color: ${color};">${score}/10</span>
                    </div>
                  </td>
              </tr>
            `;
          })
          .join("");

        const vasTableHtml = `
            <div class="vas-section-wrapper">
                <div class="vas-header-label">Pain Scale Assessment (VAS)</div>
                <table class="vas-modern-table">
                    <thead>
                        <tr>
                            <th width="25%">Location</th>
                            <th width="25%">Activity</th>
                            <th width="20%">Time</th>
                            <th width="30%">Severity</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${tableRows}
                    </tbody>
                </table>
            </div>
        `;

        contentHtml += vasTableHtml;
      }

      if (!contentHtml) return "";

      return `
          <div class="section-block">
            <div class="sec-title">Pain History</div>
            <div class="sec-content">${contentHtml}</div>
          </div>`;
    };

    // --- HTML Template (REWRITTEN) ---
    const htmlTemplate = `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="UTF-8">
    <title>OPD Assessment Sheet</title>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700;900&display=swap');
      /* Assuming A4 Paper */
      @page { size: A4; margin: 6mm 8mm 10mm 8mm; }
      * { box-sizing: border-box; }
      body {
        font-family: 'Roboto', sans-serif; /* Fallback, closer match might be Arial Narrow */
        font-size: 9.5pt;
        color: #000;
        margin: 0; padding: 0;
        line-height: 1.25;
      }
      
      /* --- HEADER STYLES --- */
      .header-wrapper {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        padding-bottom: 8px;
        /* Thick light blue bottom border */
        border-bottom: 6px solid #8fcbe5; 
        margin-bottom: 12px;
      }
      
      /* Header Left (Address & Logo) */
      .header-left {
        width: 50%;
        display: flex;
        flex-direction: column;
        align-items: flex-start;
      }
      
      /* Logo Area */
      .logo-wrapper {
        margin-bottom: 8px;
        /* Ensure logo area is big enough */
        min-height: 40px; 
      }
      .logo-img {
        width: 250px;
        max-width: 100%;
        height: auto;
        object-fit: contain;
        display: block;
      }
      
      /* Address Text Styling */
      .clinic-address {
        font-size: 8.5pt;
        color: #231f20; /* Dark Grey/Black */
        line-height: 1.35;
        font-family: 'Roboto', sans-serif;
      }
      .addr-row { display: block; margin-bottom: 1px; }
      
      /* Colors for Labels */
      .lbl-blue { color: #0054a6; font-weight: 700; }
      .lbl-red  { color: #ed1c24; font-weight: 700; }
      .txt-red  { color: #ed1c24; font-weight: 500; }
      .txt-blue { color: #0054a6; }
      
      /* Header Right (Doctor Info) */
      .header-right {
        width: 50%; /* Adjusted for balance */
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        text-align: left;
        padding-left: 10px;
      }
      
      /* Doctor Name - Large Red */
      .dr-name {
        font-size: 20pt;
        font-weight: 900;
        color: #ed1c24; /* Red */
        line-height: 1.1;
        margin-bottom: 2px;
        letter-spacing: -0.5px;
      }
      
      /* Qualifications - Blue */
      .dr-degrees {
        font-size: 8.5pt;
        font-weight: 700;
        color: #0054a6; /* Dark Blue */
        margin-bottom: 2px;
        line-height: 1.2;
      }
      
      /* Reg No - Standard */
      .dr-reg {
        font-size: 8pt;
        color: #333;
        font-weight: 500;
        margin-bottom: 4px;
      }
      
      /* Sr. Consultant - Pink/Magenta */
      .dr-title {
        font-size: 9.5pt;
        font-weight: 600;
        color: #ec008c; /* Magenta/Pink */
        margin-bottom: 1px;
      }
      
      /* Previous Exp - Purple */
      .dr-exp {
        font-size: 8.5pt;
        color: #662d91; /* Purple */
        font-weight: 500;
        line-height: 1.25;
      }
        /* --- NEW VAS TABLE STYLES --- */
      .vas-section-wrapper {
        margin-top: 10px;
        border: 1px solid #e2e8f0;
        border-radius: 6px;
        overflow: hidden;
        background: #fff;
      }
      
      .vas-header-label {
        background: #f8fafc;
        padding: 5px 10px;
        font-size: 8pt;
        font-weight: 700;
        color: #475569;
        border-bottom: 1px solid #e2e8f0;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      .vas-modern-table {
        width: 100%;
        border-collapse: collapse;
      }

      .vas-modern-table th {
        text-align: left;
        padding: 6px 10px;
        font-size: 7.5pt;
        color: #64748b;
        font-weight: 600;
        background-color: #ffffff;
        border-bottom: 1px solid #f1f5f9;
      }

      .vas-row {
        border-bottom: 1px solid #f1f5f9;
      }
      .vas-row:last-child {
        border-bottom: none;
      }

      .vas-cell {
        padding: 6px 10px;
        font-size: 8.5pt;
        color: #334155;
        vertical-align: middle;
      }

      /* Visual Bars */
      .vas-visual-container {
        display: flex;
        align-items: center;
        gap: 8px;
      }
      
      .vas-bar-bg {
        flex: 1;
        height: 6px;
        background-color: #e2e8f0;
        border-radius: 3px;
        overflow: hidden;
        min-width: 50px;
      }
      
      .vas-bar-fill {
        height: 100%;
        border-radius: 3px;
      }
      
      .vas-badge {
        font-weight: 800;
        font-size: 9pt;
        min-width: 35px;
        text-align: right;
      }

      /* Watermark */
      .watermark {
        position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
        width: 60%; max-width: 500px; opacity: 0.08; z-index: -1000; filter: grayscale(100%);
      }

      /* --- BODY & CONTENT STYLES (Existing) --- */
      .sheet-title { text-align: center; margin: 5px 0 10px 0; }
      .title-badge { background-color: #1a237e; color: white; padding: 3px 20px; border-radius: 12px; font-weight: bold; font-size: 10pt; text-transform: uppercase; }

      .patient-grid { display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 9pt; background: #f8f9fa; padding: 6px; border: 1px solid #ddd; border-radius: 4px; }
      .pg-col { width: 49%; display: flex; flex-direction: column; gap: 4px; }
      .info-row { display: flex; align-items: baseline; }
      .p-label { color: #0054a6; font-weight: 700; min-width: 75px; font-size: 8.5pt; }
      .p-val { flex: 1; border-bottom: 1px dotted #ccc; color: #000; padding-left: 5px; font-weight: 500; }

      .main-container { display: flex; flex-direction: column; gap: 8px; }
      .history-section-wrapper { display: flex; gap: 15px; }
      .history-text-col { width: 70%; display: flex; flex-direction: column; gap: 8px; }
      .history-img-col { width: 30%; display: flex; flex-direction: column; align-items: center; justify-content: flex-start; padding-top: 20px; }

      .section-block { margin-bottom: 8px; width: 100%; }
      .sec-title { color: #0054a6; font-weight: 700; font-size: 9.5pt; margin-bottom: 2px; text-transform: uppercase; border-bottom: 1px solid #e0e0e0; display: inline-block; padding-bottom: 1px; }
      .sec-content { font-size: 9pt; color: #333; padding-left: 2px; margin-top: 2px; }
      .val-list { display: flex; flex-direction: column; gap: 1px; }
      .horizontal-list { flex-direction: row; flex-wrap: wrap; gap: 12px; }
      .sub-item { display: flex; align-items: baseline; }
      .sub-key { font-weight: 600; color: #555; margin-right: 4px; font-size: 8.5pt; }
      .sub-val { font-size: 9pt; }
      .val-text { white-space: pre-wrap; line-height: 1.3; text-align: justify; }

      .exam-sub-group { margin-bottom: 4px; }
      .exam-sub-title { font-size: 8.5pt; font-weight: 600; color: #444; text-decoration: underline; margin-bottom: 2px; }
      .body-img { width: 100%; max-width: 130px; opacity: 0.95; margin-bottom: 8px; }
      .diag-labels { display: flex; justify-content: space-between; width: 100%; max-width: 130px; font-size: 7pt; font-weight: bold; margin-bottom: 2px; }

      .bmi-container { width: 100%; margin-top: 5px; padding: 4px; border: 1px solid #eee; border-radius: 4px; background: #fff; }
      .bmi-title { font-size: 8pt; font-weight: bold; color: #333; text-align: center; margin-bottom: 2px; }
      .bmi-bar { display: flex; height: 10px; width: 100%; border-radius: 5px; overflow: hidden; position: relative; margin-bottom: 2px; }
      .bmi-segment { height: 100%; }
      .seg-under { background: #f97316; } .seg-normal { background: #16a34a; } .seg-over { background: #eab308; } .seg-obese { background: #dc2626; }
      .bmi-pointer { position: absolute; top: -5px; transform: translateX(-50%); color: #000; font-size: 7px; font-weight: bold; }
      .bmi-labels { display: flex; justify-content: space-between; font-size: 5px; color: #666; text-transform: uppercase; font-weight: 600; }

      .vas-box { width: 100%; text-align: center; margin-top: 8px; padding: 4px; background: #ffebee; border-radius: 4px; font-size: 9pt; color: #c62828; border: 1px solid #ffcdd2; }
      .vas-table-container { width: 100%; margin-top: 8px; border: 1px solid #ddd; border-radius: 4px; overflow: hidden; background: #fff; }
      .vas-table-title { font-size: 8pt; font-weight: bold; color: #fff; background: #c62828; padding: 3px 6px; text-align: center; }
      .vas-table { width: 100%; border-collapse: collapse; font-size: 7.5pt; }
      .vas-table thead { background: #f5f5f5; }
      .vas-table th { padding: 3px 4px; text-align: left; font-weight: 600; color: #444; border-bottom: 2px solid #ddd; font-size: 7pt; }
      .vas-table td { padding: 3px 4px; border-bottom: 1px solid #eee; color: #333; }
      .vas-table tbody tr:last-child td { border-bottom: none; }
      .vas-table .score-cell { font-weight: bold; color: #c62828; text-align: center; }
      .signature-img { height: 40px; width: auto; max-width: 120px; display: block; margin-left: auto; margin-right: 0; }

    </style>
  </head>
  <body>
    ${logoBase64 ? `<img class="watermark" src="${logoBase64}" />` : ""}
    <div class="page">
      
      <div class="header-wrapper">
        
        <div class="header-left">
          <div class="logo-wrapper">
             ${
               logoBase64
                 ? `<img class="logo-img" src="${logoBase64}" />`
                 : '<div style="font-weight:900; font-size:18pt; color:#222;">THERA-CURE</div>'
             }
          </div>
          <div class="clinic-address">
             <div class="addr-row">
                <span class="lbl-blue">Address:</span> 361/A, Basudevpur Road, Ground Floor,
             </div>
             <div class="addr-row">
                Nilanjana Apartment, Shyamnagar, 24 Pgs. (N), Pin - 743127
             </div>
             <div class="addr-row txt-red">
                Time: Monday to Saturday (9:00 AM to 1:00 PM & 5:00 PM to 8:00 PM)
             </div>
             <div class="addr-row">
                <span class="lbl-blue">Tel:</span> (033) 3564 7255 | (+91) 8582973652 <span class="txt-blue">(ONLY FOR EMERGENCY)</span>
             </div>
             <div class="addr-row">
                <span class="lbl-blue">Email:</span> contacts@mstheracure.com | <span class="lbl-blue">Website :</span> www.mstheracure.com
             </div>
          </div>
        </div>

        <div class="header-right">
          <div class="dr-name">
            ${therapist?.user?.name || therapist?.name || "Dr. Mainak Sur (PT)"}
          </div>
          
          <div class="dr-degrees">
            ${
              therapist?.qualification ||
              "B.P.T [W.B.U.H.S], M.P.T (Neurology) [W.B.U.H.S]"
            }
          </div>

          <div class="dr-title">
             ${
               therapist?.specialization?.split(",")[0] ||
               "Sr. Consultant, Manual Physical Therapist"
             }
          </div>

          <div class="dr-exp">
             ${
               therapist?.experiences ||
               `Ex-Head of the Dept. of Physiotherapy, Swami Vivekananda University, Barrackpore
Ex-Asst. Professor, Nopany Institute of Healthcare Studies, Kol
Ex-Physiotherapist, Portea Medical`
             }
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
            assessmentData?.assessmentDate || Date.now(),
          ).toLocaleDateString("en-IN")}</span></div>
          <div class="info-row"><span class="p-label">Ht / Wt:</span><span class="p-val">${
            assessmentData?.vitals?.height || patientInfo?.height || "__"
          } cm | ${
            assessmentData?.vitals?.weight || patientInfo?.weight || "__"
          } kg</span></div>
        </div>
      </div>

      <div class="main-container">
          <div class="history-section-wrapper">
             <div class="history-text-col">
                ${renderSection(
                  "History",
                  assessmentData?.historyOfPresentIllness ||
                    assessmentData?.historyOfIllness,
                )}
                ${renderSection(
                  "Medical History",
                  assessmentData?.medicalHistory,
                )}
                ${renderSection(
                  "Surgical History",
                  assessmentData?.surgicalHistory,
                )}
                ${renderSection(
                  "Occupational History",
                  assessmentData?.occupationalHistory,
                )}
                ${renderSection(
                  "Environmental History",
                  assessmentData?.environmentalHistory,
                )}
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

          ${renderSection(
            "On Observation",
            assessmentData?.onObservation,
            true,
          )}
          ${renderSection("On Palpation", assessmentData?.onPalpation, true)}
          ${renderExaminationSection()}
          ${renderSection(
            "Differential Diagnosis",
            assessmentData?.differentialDiagnosis,
          )}
          ${renderSection("Investigations", assessmentData?.investigations)}
          ${renderSection("Special Tests", assessmentData?.specialTests)}
          ${renderSection(
            "Provisional Diagnosis",
            assessmentData?.provisionalDiagnosis,
          )}
          ${renderSection(
            "Physiotherapy Management",
            assessmentData?.physiotherapyMgmt,
          )}
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
          <div style="background-color: #0054a6; color: white; text-align: center; padding: 4px; font-weight: bold; font-size: 8px; -webkit-print-color-adjust: exact; border-radius: 2px;">
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
      }`,
    );
  } finally {
    if (browser) await browser.close();
    if (tmpDir) {
      try {
        await fs.rm(tmpDir, { recursive: true, force: true });
      } catch (e) {
        console.error(`Failed to clean up temporary directory ${tmpDir}:`, e);
      }
    }
  }
};

export default generateAssessmentPDF;
