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

    const renderSection = (label: string, value: any) => {
      if (!hasValue(value)) return "";

      let contentHtml = "";

      if (typeof value === "string" || typeof value === "number") {
        contentHtml = `<div class="val-text">${value}</div>`;
      } else if (typeof value === "object" && !Array.isArray(value)) {
        const items = Object.entries(value)
          .filter(([_, v]) => hasValue(v))
          .map(
            ([k, v]) => `
            <div class="sub-item">
              <span class="sub-key">${formatKey(k)}:</span>
              <span class="sub-val">${v}</span>
            </div>
          `
          )
          .join("");

        if (!items) return "";
        contentHtml = `<div class="val-list">${items}</div>`;
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

      return `
        <div class="section-block">
          <div class="sec-title">On Examination (Vitals)</div>
          <div class="sec-content"><div class="val-list horizontal-list">${parts}</div></div>
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

    // --- HTML Template ---
    const htmlTemplate = `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="UTF-8">
    <title>OPD Assessment Sheet</title>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700;900&display=swap');
      @page { size: A4; margin: 8mm 8mm 12mm 8mm; }
      * { box-sizing: border-box; }
      body {
        font-family: 'Roboto', sans-serif;
        font-size: 10pt;
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
      .header-wrapper { display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 5px; border-bottom: 3px solid #00aeef; margin-bottom: 10px; background: rgba(255,255,255,0.9); }
      .header-left { width: 50%; display: flex; flex-direction: column; align-items: flex-start; }
      .logo-img { width: 220px; max-width: 100%; height: auto; object-fit: contain; display: block; margin-bottom: 2px; }
      .clinic-address-block { font-size: 8.5pt; color: #222; text-align: left; line-height: 1.3; }
      .address-line { display: block; }
      .time-line { color: #ed1c24; font-weight: 700; margin-top: 2px; display: block; }
      .contact-line { font-weight: 500; display: block; }
      /* Doctor */
      .header-right { width: 48%; display: flex; flex-direction: column; align-items: flex-start; text-align: left; padding-top: 5px; }
      .dr-name { font-size: 18pt; font-weight: 900; color: #ed1c24; margin-bottom: 5px; line-height: 1; }
      .dr-section-qual { margin-bottom: 10px; }
      .dr-qual { font-size: 9pt; font-weight: 700; color: #0054a6; }
      .dr-section-exp { font-size: 8pt; color: #C71585; line-height: 1.3; }
      .dr-exp-item { display: block; }
      /* Title */
      .sheet-title { text-align: center; margin: 5px 0 15px 0; }
      .title-badge { background-color: #1a237e; color: white; padding: 4px 25px; border-radius: 15px; font-weight: bold; font-size: 11pt; text-transform: uppercase; }
      /* Patient */
      .patient-grid { display: flex; justify-content: space-between; margin-bottom: 15px; font-size: 10pt; background: rgba(253, 253, 253, 0.9); padding: 5px; border: 1px solid #eee; border-radius: 4px; }
      .pg-col { width: 49%; display: flex; flex-direction: column; gap: 5px; }
      .info-row { display: flex; align-items: baseline; }
      .info-label { color: #0054a6; font-weight: 600; min-width: 85px; font-size: 9pt; }
      .info-val { flex: 1; border-bottom: 1px dotted #ccc; color: #000; padding-left: 5px; font-weight: 500; }
      /* Content */
      .content-area { display: flex; gap: 15px; position: relative; }
      .col-text { width: 72%; }
      .col-img { width: 28%; display: flex; flex-direction: column; align-items: center; }
      /* Sections */
      .section-block { margin-bottom: 10px; }
      .sec-title { color: #0054a6; font-weight: 700; font-size: 10pt; margin-bottom: 2px; text-transform: uppercase; border-bottom: 1px solid #e0e0e0; display: inline-block; padding-bottom: 1px; }
      .sec-content { font-size: 9.5pt; color: #333; padding-left: 2px; margin-top: 2px; }
      .val-list { display: flex; flex-direction: column; gap: 1px; }
      .horizontal-list { flex-direction: row; flex-wrap: wrap; gap: 10px; }
      .sub-item { display: flex; align-items: baseline; }
      .sub-key { font-weight: 600; color: #555; margin-right: 5px; font-size: 9pt; text-transform: capitalize; }
      .val-text { white-space: pre-wrap; line-height: 1.35; text-align: justify; }
      /* Images */
      .body-img { width: 100%; max-width: 160px; opacity: 0.95; margin-top: 5px; margin-bottom: 15px; }
      .diag-labels { display: flex; justify-content: space-between; width: 100%; max-width: 160px; font-size: 8pt; font-weight: bold; }
      /* BMI */
      .bmi-container { width: 100%; margin-top: 5px; padding: 5px; border: 1px solid #eee; border-radius: 4px; background: #fff; }
      .bmi-title { font-size: 9pt; font-weight: bold; color: #333; text-align: center; margin-bottom: 3px; }
      .bmi-bar { display: flex; height: 12px; width: 100%; border-radius: 6px; overflow: hidden; position: relative; margin-bottom: 3px; }
      .bmi-segment { height: 100%; }
      .seg-under { background: #f97316; } .seg-normal { background: #16a34a; } .seg-over { background: #eab308; } .seg-obese { background: #dc2626; }
      .bmi-pointer { position: absolute; top: -6px; transform: translateX(-50%); color: #000; font-size: 8px; font-weight: bold; }
      .bmi-labels { display: flex; justify-content: space-between; font-size: 6px; color: #666; text-transform: uppercase; font-weight: 600; }
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
            <span class="time-line">Time: Mon to Sat (9:00 AM to 7:00 PM)</span>
            <span class="contact-line">Tel: (033) 3564 7255 | +91 9082125253</span>
          </div>
        </div>
        <div class="header-right">
          <div class="dr-name">${
            therapist?.user?.name || therapist?.name || "Dr. Diksha Palit (PT)"
          }</div>
          <div class="dr-section-qual">
            <div class="dr-qual">${
              therapist?.qualification ||
              "B.P.T [W.B.U.H.S], CDNT<br>Co-Founder & Consultant Physiotherapist"
            }</div>
          </div>
          <div class="dr-section-exp">
            ${
              therapist?.specialization
                ? therapist.specialization
                    .split(",")
                    .map(
                      (s: string) =>
                        `<span class="dr-exp-item">• ${s.trim()}</span>`
                    )
                    .join("")
                : `<span class="dr-exp-item">• Ex-Intern Physiotherapist of Belle Vue Clinic</span>`
            }
          </div>
        </div>
      </div>

      <div class="sheet-title"><span class="title-badge">OPD ASSESSMENT SHEET</span></div>

      <div class="patient-grid">
        <div class="pg-col">
          <div class="info-row"><span class="info-label">Name:</span><span class="info-val">${
            patientInfo?.patientName ||
            patientInfo?.name ||
            assessmentData?.patientName ||
            ""
          }</span></div>
          <div class="info-row"><span class="info-label">Age / Sex:</span><span class="info-val">${
            patientInfo?.age || assessmentData?.age || ""
          } / ${
      patientInfo?.gender || assessmentData?.gender || ""
    }</span></div>
          <div class="info-row"><span class="info-label">Chief C/O:</span><span class="info-val">${
            assessmentData?.chiefComplaints || ""
          }</span></div>
        </div>
        <div class="pg-col">
          <div class="info-row"><span class="info-label">Patient ID:</span><span class="info-val">${
            assessmentData?.patientId || patientInfo?.patientId || "THRC"
          }</span></div>
          <div class="info-row"><span class="info-label">Date:</span><span class="info-val">${new Date(
            assessmentData?.assessmentDate || Date.now()
          ).toLocaleDateString("en-IN")}</span></div>
          <div class="info-row"><span class="info-label">Ht / Wt:</span><span class="info-val">${
            assessmentData?.vitals?.height || patientInfo?.height || "__"
          } cm | ${
      assessmentData?.vitals?.weight || patientInfo?.weight || "__"
    } kg</span></div>
        </div>
      </div>

      <div class="content-area">
        <div class="col-text">
          ${renderSection(
            "History (H/O)",
            assessmentData?.historyOfPresentIllness ||
              assessmentData?.historyOfIllness
          )}
          
          ${renderSection("Pain History", assessmentData?.painHistory)}
          
          ${renderVitalsText()}
          
          ${renderSection("On Observation", assessmentData?.onObservation)}
          
          ${renderSection("On Palpation", assessmentData?.onPalpation)}
          
          ${renderSection(
            "Motor Examination",
            assessmentData?.motorExamination
          )}

          ${renderSection(
            "Neurological Examination",
            assessmentData?.neurologicalExamination
          )}

          ${renderSection("Special Tests", assessmentData?.specialTests)}
          ${renderSection(
            "Differential Diagnosis",
            assessmentData?.differentialDiagnosis
          )}
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

        <div class="col-img">
          ${
            bodyBase64
              ? `<div class="diag-labels"><span>R</span> <span>L</span> <span>L</span> <span>R</span></div><img src="${bodyBase64}" class="body-img" />`
              : ""
          }
          ${renderBMIChart()}
        </div>
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
      margin: { top: "8mm", right: "8mm", bottom: "15mm", left: "8mm" },
      displayHeaderFooter: true,
      headerTemplate: "<div></div>",
      footerTemplate: `
        <div style="width: 100%; font-size: 10px; font-family: 'Roboto', sans-serif;">
          <div style="margin-right: 40px; text-align: right; margin-bottom: 20px;">
             <div style="font-family: serif; font-style: italic; font-weight: bold; font-size: 16px; color: #000;">Signature</div>
          </div>
          <div style="background-color: #ed1c24; color: white; text-align: center; padding: 4px; font-weight: bold; font-size: 8px; -webkit-print-color-adjust: exact;">
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
