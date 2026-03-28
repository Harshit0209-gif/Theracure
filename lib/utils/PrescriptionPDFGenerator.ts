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
        "--no-sandbox",
        "--disable-setuid-sandbox",
      ],
    };
    browser = await puppeteer.launch(launchConfig);

    const page = await browser.newPage();
    page.setDefaultTimeout(30000);

    const images = await getImagesAsBase64(["image.png", "humen-body.jpg"]);

    const logoBase64 = images["image.png"];
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

    // Helper to safely display values (don't show null/undefined)
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

      /* A4 Paper with exact dimensions */
      @page {
        size: A4 portrait;
        margin: 3mm 8mm 10mm 8mm; /* Reduced top margin from 6mm to 3mm */
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }

      * {
        box-sizing: border-box;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }

      html {
        width: 210mm;
        height: 297mm;
      }

      body {
        font-family: 'Roboto', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        font-size: 9.5pt;
        color: #000;
        margin: 0;
        padding: 0;
        line-height: 1.25;
        width: 100%;
        height: 100%;
        background: white;
      }
      
      /* --- HEADER STYLES - ALIGNED WITH REFERENCE PDF --- */
      .header-wrapper {
        display: flex;
        flex-direction: row; /* Changed from column */
        justify-content: space-between;
        align-items: center; /* Align items to the center for vertical balance */
        padding: 12px 0 10px 0;
        border-bottom: 6px solid #00a8e1;
        margin-bottom: 8px;
        page-break-inside: avoid;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
        gap: 15px;
      }

      /* Header Left (Logo & Address) */
      .header-left {
        width: 45%;
        max-width: 45%;
        display: flex;
        flex-direction: column;
        align-items: flex-start;
      }
      
      .logo-img {
        width: 380px; /* Increased from 280px */
        max-width: 100%;
        height: auto;
        max-height: 160px;
        object-fit: contain;
        display: block;
        margin-bottom: 8px; /* Space between logo and address */
      }
      
      /* Address Text Styling - Consistent Spacing */
      .clinic-address {
        font-size: 10.5pt; /* Increased from 8.5pt */
        color: #1f1f1f;
        line-height: 1.4;
        font-family: 'Roboto', sans-serif;
        width: 100%;
      }
      .addr-row {
        display: block;
        margin-bottom: 2px;
        line-height: 1.4;
      }

      /* Colors for Labels - Print Safe */
      .lbl-blue {
        color: #0054a6;
        font-weight: 700;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      .lbl-red {
        color: #ed1c24;
        font-weight: 700;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      .txt-red {
        color: #ed1c24;
        font-weight: 600; /* Increased weight */
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      .txt-blue {
        color: #0054a6;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }

      /* Header Right (Doctor Info) - Fixed Width */
      .header-right {
        width: 55%;
        max-width: 55%;
        display: flex;
        flex-direction: column;
        align-items: flex-start; /* CHANGED */
        text-align: left; /* CHANGED */
      }
      
      /* Doctor Name - Large Red - Fixed Dimensions */
      .dr-name {
        font-size: 26pt; /* Increased from 20pt */
        font-weight: 900;
        color: #d31e24;
        line-height: 1.1;
        margin-bottom: 4px;
        letter-spacing: -0.5px;
        white-space: normal;
        text-align: left; /* CHANGED */
        width: 100%;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }

      /* Qualifications - Blue - Consistent Spacing */
      .dr-degrees {
        font-size: 12pt; /* Increased from 9.5pt */
        font-weight: 700;
        color: #005eb8;
        margin-bottom: 4px;
        line-height: 1.2;
        text-align: left; /* CHANGED */
        width: 100%;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }

      /* Reg No - Standard - Consistent Spacing */
      .dr-reg {
        font-size: 9.5pt; /* Increased from 8pt */
        color: #333;
        font-weight: 600;
        margin-bottom: 2px;
        line-height: 1.2;
        text-align: left; /* CHANGED */
        width: 100%;
      }

      /* Sr. Consultant - Pink/Magenta - Fixed Spacing (from original, can be repurposed) */
      .dr-title {
        font-size: 12.5pt; /* Increased from 10.5pt */
        font-weight: 700;
        color: #d6006f;
        margin-bottom: 4px;
        line-height: 1.2;
        text-align: left; /* CHANGED */
        width: 100%;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }

      /* Previous Exp - Purple - Fixed Spacing */
      .dr-exp {
        font-size: 10pt; /* Increased from 8.5pt */
        color: #662d91;
        font-weight: 500;
        line-height: 1.4;
        white-space: pre-line;
        text-align: left; /* CHANGED */
        width: 100%;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
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

      /* --- BODY & CONTENT STYLES - STANDARDIZED --- */
      .sheet-title {
        text-align: center;
        margin: 10px 0 12px 0;
        page-break-inside: avoid;
      }
      .title-badge {
        background-color: #1e3a8a;
        color: white;
        padding: 6px 28px;
        border-radius: 14px;
        font-weight: 800;
        font-size: 10.5pt;
        text-transform: uppercase;
        display: inline-block;
        letter-spacing: 0.5px;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }

      /* Patient Details Grid - Fixed Layout */
      .patient-grid {
        display: flex;
        justify-content: space-between;
        margin-bottom: 14px;
        font-size: 9pt;
        background: #f9fafb;
        padding: 10px 12px;
        border: 1px solid #d1d5db;
        border-radius: 5px;
        page-break-inside: avoid;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      .pg-col {
        width: 49%;
        max-width: 49%;
        display: flex;
        flex-direction: column;
        gap: 6px;
      }
      .info-row {
        display: flex;
        align-items: baseline;
        min-height: 20px;
      }
      .p-label {
        color: #0066cc;
        font-weight: 700;
        min-width: 85px;
        max-width: 85px;
        font-size: 9pt;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      .p-val {
        flex: 1;
        border-bottom: 1px dotted #9ca3af;
        color: #1a1a1a;
        padding-left: 8px;
        padding-bottom: 2px;
        font-weight: 500;
        font-size: 9pt;
        min-height: 18px;
      }

      /* Main Container - Fixed Layout */
      .main-container {
        display: flex;
        flex-direction: column;
        gap: 10px;
        width: 100%;
      }
      .history-section-wrapper {
        display: flex;
        gap: 15px;
        width: 100%;
      }
      .history-text-col {
        width: 70%;
        max-width: 70%;
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      .history-img-col {
        width: 30%;
        max-width: 30%;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: flex-start;
        padding-top: 10px;
      }

      /* Section Blocks - Standardized */
      .section-block {
        margin-bottom: 12px;
        width: 100%;
        page-break-inside: avoid;
      }
      .sec-title {
        color: #0066cc;
        font-weight: 700;
        font-size: 10pt;
        margin-bottom: 5px;
        text-transform: uppercase;
        border-bottom: 2px solid #cbd5e1;
        display: inline-block;
        padding-bottom: 3px;
        letter-spacing: 0.3px;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      .sec-content {
        font-size: 9pt;
        color: #374151;
        padding-left: 4px;
        margin-top: 6px;
        line-height: 1.5;
      }
      .val-list {
        display: flex;
        flex-direction: column;
        gap: 3px;
      }
      .horizontal-list {
        flex-direction: row;
        flex-wrap: wrap;
        gap: 14px;
      }
      .sub-item {
        display: flex;
        align-items: baseline;
        margin-bottom: 2px;
      }
      .sub-key {
        font-weight: 600;
        color: #555;
        margin-right: 5px;
        font-size: 8.5pt;
      }
      .sub-val {
        font-size: 9pt;
        color: #000;
      }
      .val-text {
        white-space: pre-wrap;
        line-height: 1.4;
        text-align: justify;
        word-wrap: break-word;
      }

      /* Examination Subsections - Fixed Spacing */
      .exam-sub-group {
        margin-bottom: 6px;
        page-break-inside: avoid;
      }
      .exam-sub-title {
        font-size: 8.5pt;
        font-weight: 600;
        color: #444;
        text-decoration: underline;
        margin-bottom: 3px;
      }

      /* Body Image - Fixed Dimensions */
      .body-img {
        width: 100%;
        max-width: 130px;
        height: auto;
        opacity: 0.95;
        margin-bottom: 8px;
        display: block;
      }
      .diag-labels {
        display: flex;
        justify-content: space-between;
        width: 100%;
        max-width: 130px;
        font-size: 7pt;
        font-weight: bold;
        margin-bottom: 3px;
      }

      /* BMI Chart - Fixed Dimensions */
      .bmi-container {
        width: 100%;
        max-width: 150px;
        margin-top: 8px;
        padding: 6px;
        border: 1px solid #ddd;
        border-radius: 4px;
        background: #fff;
        page-break-inside: avoid;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      .bmi-title {
        font-size: 8pt;
        font-weight: bold;
        color: #333;
        text-align: center;
        margin-bottom: 4px;
      }
      .bmi-bar {
        display: flex;
        height: 10px;
        width: 100%;
        border-radius: 5px;
        overflow: hidden;
        position: relative;
        margin-bottom: 4px;
      }
      .bmi-segment {
        height: 100%;
      }
      .seg-under {
        background: #f97316;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      .seg-normal {
        background: #16a34a;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      .seg-over {
        background: #eab308;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      .seg-obese {
        background: #dc2626;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      .bmi-pointer {
        position: absolute;
        top: -6px;
        transform: translateX(-50%);
        color: #000;
        font-size: 8px;
        font-weight: bold;
      }
      .bmi-labels {
        display: flex;
        justify-content: space-between;
        font-size: 6px;
        color: #666;
        text-transform: uppercase;
        font-weight: 600;
      }

      /* Notes and Additional Sections - Standardized */
      .vas-box {
        width: 100%;
        text-align: center;
        margin-top: 10px;
        padding: 6px;
        background: #ffebee;
        border-radius: 4px;
        font-size: 9pt;
        color: #c62828;
        border: 1px solid #ffcdd2;
        page-break-inside: avoid;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }

      .vas-table-container {
        width: 100%;
        margin-top: 10px;
        border: 1px solid #ddd;
        border-radius: 4px;
        overflow: hidden;
        background: #fff;
        page-break-inside: avoid;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }

      .vas-table-title {
        font-size: 8pt;
        font-weight: bold;
        color: #fff;
        background: #c62828;
        padding: 4px 8px;
        text-align: center;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }

      .vas-table {
        width: 100%;
        border-collapse: collapse;
        font-size: 7.5pt;
      }
      .vas-table thead {
        background: #f5f5f5;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      .vas-table th {
        padding: 4px 6px;
        text-align: left;
        font-weight: 600;
        color: #444;
        border-bottom: 2px solid #ddd;
        font-size: 7.5pt;
      }
      .vas-table td {
        padding: 4px 6px;
        border-bottom: 1px solid #eee;
        color: #333;
        font-size: 8pt;
      }
      .vas-table tbody tr:last-child td {
        border-bottom: none;
      }
      .vas-table .score-cell {
        font-weight: bold;
        color: #c62828;
        text-align: center;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }

      /* Signature Area - Fixed Dimensions */
      .signature-img {
        height: 45px;
        width: auto;
        max-width: 130px;
        display: block;
        margin-left: auto;
        margin-right: 0;
      }

      /* Print-Specific Media Query for Exact Consistency */
      @media print {
        * {
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }

        body {
          width: 210mm;
          height: 297mm;
          margin: 0;
          padding: 0;
        }

        .header-wrapper,
        .patient-grid,
        .section-block,
        .exam-sub-group,
        .bmi-container,
        .vas-section-wrapper,
        .vas-table-container {
          page-break-inside: avoid;
        }

        /* Ensure borders and backgrounds print */
        .header-wrapper {
          border-bottom: 5px solid #00a8e1 !important;
        }

        .title-badge {
          background-color: #1e3a8a !important;
          color: white !important;
        }

        .patient-grid {
          background: #f9fafb !important;
          border: 1px solid #d1d5db !important;
        }
      }

      /* Screen-only styles for preview */
      @media screen {
        body {
          max-width: 210mm;
          margin: 0 auto;
          box-shadow: 0 0 20px rgba(0,0,0,0.1);
        }
      }

    </style>
  </head>
  <body>
    ${logoBase64 ? `<img class="watermark" src="${logoBase64}" />` : ""}
    <div class="page">
      
      <div class="header-wrapper">
        <div class="header-left">
          ${
            logoBase64
              ? `<img class="logo-img" src="${logoBase64}" />`
              : '<div style="font-weight:900; font-size:24pt; color:#222; margin-bottom: 15px;">THERA-CURE</div>'
          }
          <div class="clinic-address">
              <div class="addr-row">
                <span class="lbl-blue">Address:</span> 361/A, Basudevpur Road, Ground Floor,
              </div>
              <div class="addr-row">
                Nilanjana Apartment, Shyamnagar, 24 Pgs. (N), Pin - 743127
              </div>
              <div class="addr-row txt-red">
                Time: Monday to Saturday (9:00 AM to 8:00 PM)
              </div>
              <div class="addr-row">
                <span class="lbl-blue">Tel:</span> (033) 3564 7255 | (+91) 8582973652 <span class="txt-red">(ONLY FOR EMERGENCY)</span>
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
              "B.P.T [W.B.U.H.S], M.P.T (Neurology) [W.B.U.H.S], C.O.M.T, M.I.A.P, C.M.F.R.P"
            }
          </div>
          
          <div class="dr-reg">I.A.P Regd. No. : L-42691</div>
          <div class="dr-reg">C.O.M.T Regd. No.: 8806/T/A/192</div>
          <div class="dr-reg" style="margin-bottom: 1px;">C.M.F.R.P Regd. No.: PO/CMFRP/033</div>

          <div class="dr-exp">
              ${
                therapist?.experiences ||
                `Physiotherapist of The Badminton Academy,
Department of Sports And Youth Services, Govt. of W.B.
Ex-Head of the Dept. of Physiotherapy, Swami Vivekananda University, Barrackpore
Ex-Asst. Professor, Nopany Institute of Healthcare Studies, Kol`
              }
          </div>
        </div>
      </div>
      <div class="sheet-title"><span class="title-badge">OPD ASSESSMENT SHEET</span></div>

      <div class="patient-grid">
        <div class="pg-col">
          <div class="info-row"><span class="p-label">Name:</span><span class="p-val">${safeValue(
            patientInfo?.patientName ||
              patientInfo?.name ||
              assessmentData?.patientName,
          )}</span></div>
          <div class="info-row"><span class="p-label">Age / Sex:</span><span class="p-val">${safeValue(
            patientInfo?.age || assessmentData?.age,
          )} ${safeValue(patientInfo?.age || assessmentData?.age) && safeValue(patientInfo?.gender || assessmentData?.gender) ? "/" : ""} ${safeValue(
            patientInfo?.gender || assessmentData?.gender,
          )}</span></div>
          <div class="info-row"><span class="p-label">Chief C/O:</span><span class="p-val">${safeValue(
            assessmentData?.chiefComplaints,
          )}</span></div>
        </div>
        <div class="pg-col">
          <div class="info-row"><span class="p-label">Patient ID:</span><span class="p-val">${safeValue(
            assessmentData?.patientId || patientInfo?.patientId,
            "THRC",
          )}</span></div>
          <div class="info-row"><span class="p-label">Date:</span><span class="p-val">${new Date(
            assessmentData?.assessmentDate || Date.now(),
          ).toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata" })}</span></div>
          <div class="info-row"><span class="p-label">Ht / Wt:</span><span class="p-val">${
            safeValue(assessmentData?.vitals?.height || patientInfo?.height)
              ? safeValue(
                  assessmentData?.vitals?.height || patientInfo?.height,
                ) + " cm"
              : ""
          }${
            safeValue(assessmentData?.vitals?.height || patientInfo?.height) &&
            safeValue(assessmentData?.vitals?.weight || patientInfo?.weight)
              ? " | "
              : ""
          }${
            safeValue(assessmentData?.vitals?.weight || patientInfo?.weight)
              ? safeValue(
                  assessmentData?.vitals?.weight || patientInfo?.weight,
                ) + " kg"
              : ""
          }</span></div>
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
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "6mm", right: "8mm", bottom: "12mm", left: "8mm" },
      displayHeaderFooter: true,
      headerTemplate: "<div></div>",
      footerTemplate: `
        <div style="width: 100%; font-size: 10px; font-family: 'Roboto', sans-serif; padding-right: 8mm; padding-left: 8mm; margin-top: 5mm;">
          <div style="display: flex; justify-content: flex-end; align-items: flex-end; margin-bottom: 8px; page-break-inside: avoid;">
             <div style="text-align: right;">
                 <div style="font-family: 'Dancing Script', cursive; font-size: 18px; color: #000; margin-bottom: 3px; font-weight: 600;">
                    ${therapist?.user?.name || therapist?.name || "Signature"}
                 </div>
                 <div style="border-top: 2px solid #000; width: 140px; display: inline-block; margin-bottom: 2px;"></div>
                 <div style="font-size: 7.5px; font-weight: bold; color: #333; letter-spacing: 0.5px;">DIGITAL SIGNATURE</div>
             </div>
          </div>
          <div style="text-align: center; margin-bottom: 6px; font-weight: 600; font-size: 9pt; color: #555; letter-spacing: 0.3px;">
              --- End of Assessment ---
          </div>
          <div style="background-color: #0054a6; color: white; text-align: center; padding: 5px 8px; font-weight: bold; font-size: 7.5px; -webkit-print-color-adjust: exact; print-color-adjust: exact; border-radius: 2px; letter-spacing: 0.3px;">
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
