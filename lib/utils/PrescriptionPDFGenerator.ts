import puppeteer from "puppeteer";
import path from "path";
import { fileURLToPath } from "url";
import { getImagesAsBase64 } from "./imageUtils.node";
import { calculateSimpleBMI } from "@/lib/utils/bmi-claculator";

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

  const getBMIData = (weight: number, height: number) => {
    if (!weight || !height) return null;
    return calculateSimpleBMI(weight, height);
  };

  const renderBMIChart = () => {
    const vitals = assessmentData?.vitals;
    const patientBMI =
      vitals?.bmi ||
      (vitals?.weight && vitals?.height
        ? calculateSimpleBMI(vitals.weight, vitals.height)?.bmi
        : null);

    return `
      <div class="bmi-chart-section">
        <div class="section-label">BMI Reference Chart</div>
        <div class="bmi-chart">
          <div class="bmi-ranges">
            <div class="bmi-range underweight">
              <div class="bmi-color-bar" style="background: #f97316;"></div>
              <div class="bmi-range-info">
                <span class="bmi-range-label">Underweight</span>
                <span class="bmi-range-value">< 18.5</span>
              </div>
            </div>
            <div class="bmi-range normal">
              <div class="bmi-color-bar" style="background: #16a34a;"></div>
              <div class="bmi-range-info">
                <span class="bmi-range-label">Normal</span>
                <span class="bmi-range-value">18.5 - 24.9</span>
              </div>
            </div>
            <div class="bmi-range overweight">
              <div class="bmi-color-bar" style="background: #eab308;"></div>
              <div class="bmi-range-info">
                <span class="bmi-range-label">Overweight</span>
                <span class="bmi-range-value">25.0 - 29.9</span>
              </div>
            </div>
            <div class="bmi-range obese">
              <div class="bmi-color-bar" style="background: #dc2626;"></div>
              <div class="bmi-range-info">
                <span class="bmi-range-label">Obese</span>
                <span class="bmi-range-value">≥ 30.0</span>
              </div>
            </div>
          </div>
          ${
            patientBMI
              ? `
          <div class="patient-bmi-indicator">
            <div class="bmi-scale">
              <div class="bmi-scale-bar">
                <div class="bmi-sections">
                  <div class="bmi-section" style="background: #f97316; width: 18.5%;"></div>
                  <div class="bmi-section" style="background: #16a34a; width: 24.5%;"></div>
                  <div class="bmi-section" style="background: #eab308; width: 19.5%;"></div>
                  <div class="bmi-section" style="background: #dc2626; width: 37.5%;"></div>
                </div>
                <div class="bmi-pointer" style="left: ${Math.min(
                  95,
                  (patientBMI / 40) * 100
                )}%;">
                  <div class="bmi-pointer-arrow">▼</div>
                  <div class="bmi-pointer-value">${patientBMI}</div>
                </div>
              </div>
              <div class="bmi-scale-labels">
                <span>0</span>
                <span>18.5</span>
                <span>25</span>
                <span>30</span>
                <span>40+</span>
              </div>
            </div>
          </div>`
              : ""
          }
        </div>
      </div>
    `;
  };

  // Helper function to render section conditionally with better formatting
  const renderSection = (
    label: string,
    value: any,
    className: string = "assessment-section"
  ) => {
    if (!hasValue(value)) return "";

    let displayValue = value;
    if (typeof value === "object" && !Array.isArray(value)) {
      // Handle object values by showing non-empty fields
      const objFields = Object.entries(value)
        .filter(([k, v]) => hasValue(v))
        .map(([k, v]) => `${k}: ${v}`)
        .join(", ");
      displayValue = objFields || "";
    }

    if (!displayValue || displayValue.toString().trim() === "") return "";

    return `
      <div class="${className}">
        <div class="section-label">${label}</div>
        <div class="section-content">${displayValue}</div>
      </div>
    `;
  };

  const renderVitalsSection = () => {
    const vitals = assessmentData?.vitals;
    if (!vitals) return "";

    let vitalsHTML = `
      <div class="assessment-section">
        <div class="section-label">On Examination (Vitals)</div>
        <div class="vitals-grid">
    `;

    // Blood pressure
    if (
      hasValue(vitals.bloodPressure?.systolic) ||
      hasValue(vitals.bloodPressure?.diastolic)
    ) {
      const systolic = vitals.bloodPressure?.systolic || "0";
      const diastolic = vitals.bloodPressure?.diastolic || "0";
      vitalsHTML += `
        <div class="vital-item">
          <span class="vital-label">Blood Pressure:</span>
          <span class="vital-value">${systolic}/${diastolic} mmHg</span>
        </div>
      `;
    }

    // Pulse
    if (hasValue(vitals.pulse)) {
      vitalsHTML += `
        <div class="vital-item">
          <span class="vital-label">Pulse Rate:</span>
          <span class="vital-value">${vitals.pulse} beats/min</span>
        </div>
      `;
    }

    // Weight
    if (hasValue(vitals.weight)) {
      vitalsHTML += `
        <div class="vital-item">
          <span class="vital-label">Weight:</span>
          <span class="vital-value">${vitals.weight} kg</span>
        </div>
      `;
    }

    // Height
    if (hasValue(vitals.height)) {
      vitalsHTML += `
        <div class="vital-item">
          <span class="vital-label">Height:</span>
          <span class="vital-value">${vitals.height} cm</span>
        </div>
      `;
    }

    // BMI with status and color coding
    if (hasValue(vitals.bmi)) {
      const bmiData = getBMIData(vitals.weight, vitals.height) || {
        bmi: vitals.bmi,
        status: "Unknown",
        color: "#666",
      };
      vitalsHTML += `
        <div class="vital-item">
          <span class="vital-label">BMI:</span>
          <span class="vital-value">${bmiData.bmi} kg/cm²
        </div>
      `;
    } else if (hasValue(vitals.weight) && hasValue(vitals.height)) {
      // Calculate BMI if not provided
      const bmiData = getBMIData(vitals.weight, vitals.height);
      if (bmiData) {
        vitalsHTML += `
          <div class="vital-item">
            <span class="vital-label">BMI:</span>
            <span class="vital-value">${bmiData.bmi} kg/cm² <span class="bmi-status" style="color: ${bmiData.color};">(${bmiData.status})</span></span>
          </div>
        `;
      }
    }

    // Temperature
    if (hasValue(vitals.temperature)) {
      vitalsHTML += `
        <div class="vital-item">
          <span class="vital-label">Temperature:</span>
          <span class="vital-value">${vitals.temperature} °F</span>
        </div>
      `;
    }

    // Sugar Level
    if (hasValue(vitals.sugar)) {
      vitalsHTML += `
        <div class="vital-item">
          <span class="vital-label">Sugar Level:</span>
          <span class="vital-value">${vitals.sugar} mg/dL</span>
        </div>
      `;
    }

    vitalsHTML += `
        </div>
      </div>
    `;

    // Only return if we have actual vital signs data
    if (vitalsHTML.includes("vital-item")) {
      return vitalsHTML;
    }
    return "";
  };

  // Helper function to render pain history with structured layout
  const renderPainHistory = () => {
    const pain = assessmentData?.painHistory;
    if (!pain) return "";

    let painHTML = `
      <div class="assessment-section">
        <div class="section-label">Pain History</div>
        <div class="pain-grid">
    `;

    if (hasValue(pain.location)) {
      painHTML += `
        <div class="pain-item">
          <span class="pain-label">Location:</span>
          <span class="pain-value">${pain.location
            .replace("_", " ")
            .replace(/\b\w/g, (l: any) => l.toUpperCase())}</span>
        </div>
      `;
    }

    if (hasValue(pain.nature)) {
      painHTML += `
        <div class="pain-item">
          <span class="pain-label">Nature:</span>
          <span class="pain-value">${
            pain.nature.charAt(0).toUpperCase() + pain.nature.slice(1)
          }</span>
        </div>
      `;
    }

    if (hasValue(pain.vasScore)) {
      painHTML += `
        <div class="pain-item">
          <span class="pain-label">VAS Score:</span>
          <span class="pain-value">${pain.vasScore}/10</span>
        </div>
      `;
    }

    if (hasValue(pain.duration)) {
      painHTML += `
        <div class="pain-item">
          <span class="pain-label">Duration:</span>
          <span class="pain-value">${pain.duration}</span>
        </div>
      `;
    }

    if (hasValue(pain.aggravatingFactors)) {
      painHTML += `
        <div class="pain-item full-width">
          <span class="pain-label">Aggravating Factors:</span>
          <span class="pain-value">${pain.aggravatingFactors}</span>
        </div>
      `;
    }

    if (hasValue(pain.relievingFactors)) {
      painHTML += `
        <div class="pain-item full-width">
          <span class="pain-label">Relieving Factors:</span>
          <span class="pain-value">${pain.relievingFactors}</span>
        </div>
      `;
    }

    painHTML += `
        </div>
      </div>
    `;

    if (painHTML.includes("pain-item")) {
      return painHTML;
    }
    return "";
  };

  // Helper function to render observation data with grid layout
  const renderObservation = () => {
    const obs = assessmentData?.onObservation;
    if (!obs) return "";

    let obsHTML = `
      <div class="assessment-section">
        <div class="section-label">On Observation</div>
        <div class="obs-grid">
    `;

    if (hasValue(obs.bodyBuild)) {
      obsHTML += `
        <div class="obs-item">
          <span class="obs-label">Body Build:</span>
          <span class="obs-value">${obs.bodyBuild}</span>
        </div>
      `;
    }

    if (hasValue(obs.posture)) {
      obsHTML += `
        <div class="obs-item">
          <span class="obs-label">Posture:</span>
          <span class="obs-value">${obs.posture}</span>
        </div>
      `;
    }

    if (hasValue(obs.gait)) {
      obsHTML += `
        <div class="obs-item">
          <span class="obs-label">Gait:</span>
          <span class="obs-value">${obs.gait
            .replace("_", " ")
            .replace(/\b\w/g, (l: any) => l.toUpperCase())}</span>
        </div>
      `;
    }

    if (hasValue(obs.weightBearing)) {
      obsHTML += `
        <div class="obs-item">
          <span class="obs-label">Weight Bearing:</span>
          <span class="obs-value">${obs.weightBearing
            .replace("_", " ")
            .replace(/\b\w/g, (l: any) => l.toUpperCase())}</span>
        </div>
      `;
    }

    if (hasValue(obs.peripheralPulses)) {
      obsHTML += `
        <div class="obs-item">
          <span class="obs-label">Peripheral Pulses:</span>
          <span class="obs-value">${obs.peripheralPulses}</span>
        </div>
      `;
    }

    if (hasValue(obs.localExam)) {
      obsHTML += `
        <div class="obs-item full-width">
          <span class="obs-label">Local Examination:</span>
          <span class="obs-value">${obs.localExam}</span>
        </div>
      `;
    }

    obsHTML += `
        </div>
      </div>
    `;

    if (obsHTML.includes("obs-item")) {
      return obsHTML;
    }
    return "";
  };

  // HTML Template with improved styling and page signature
  const htmlTemplate = `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="UTF-8">
    <title>OPD Assessment Sheet - Thera-Cure</title>
    <style>
      @page {
        size: A4;
        margin: 10mm 10mm 30mm 10mm; /* Bottom margin for signature and footer */
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
        color: #2c3e50;
        background: white;
        margin: 0;
        padding: 0;
      }
      
      .page {
        width: 100%;
        min-height: 100vh;
        padding: 0;
        position: relative;
        padding-bottom: 20px; /* Reduced padding for signature space */
      }
      
      /* Header Section */
      .header {
        display: flex;
        align-items: flex-start;
        margin-bottom: 15px;
        border-bottom: 3px solid #3498db;
        padding-bottom: 10px;
      }
      
      .clinic-info {
        flex: 1;
      }
      
      .logo-image {
        width: 120px;
        height: auto;
        margin-bottom: 8px;
      }
      
      .logo-fallback {
        width: 120px;
        height: 50px;
        background: linear-gradient(135deg, #3498db, #2980b9);
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: bold;
        font-size: 20px;
        letter-spacing: 2px;
        margin-bottom: 8px;
      }
      
      .contact-info {
        font-size: 10px;
        line-height: 1.3;
        color: #495057;
      }
      
      .contact-info p {
        margin-bottom: 2px;
      }
      
      .doctor-info {
        width: 280px;
        text-align: right;
        font-size: 10px;
      }
      
      .doctor-name {
        font-size: 14px;
        font-weight: bold;
        color: #e74c3c;
        margin-bottom: 4px;
      }
      
      .doctor-qualifications {
        font-size: 9px;
        line-height: 1.2;
        color: #6c757d;
        margin-bottom: 4px;
      }
      
      .doctor-details {
        font-size: 9px;
        line-height: 1.2;
        color: #868e96;
      }
      
      /* Form Title */
      .form-title {
        background: linear-gradient(135deg, #3498db, #2980b9);
        color: white;
        text-align: center;
        padding: 10px;
        font-size: 16px;
        font-weight: bold;
        margin: 10px 0;
        border-radius: 5px;
        letter-spacing: 1px;
      }
      
      /* Patient Info Section */
      .patient-info-container {
        margin-bottom: 15px;
        page-break-inside: avoid;
        page-break-after: avoid;
      }
      
      .patient-info {
        background: #f8f9fa;
        padding: 12px;
        border-radius: 8px;
        border-left: 5px solid #3498db;
        margin-bottom: 15px;
        page-break-inside: avoid;
      }
      
      .patient-info-title {
        font-size: 14px;
        font-weight: bold;
        color: #2c3e50;
        margin-bottom: 10px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      
      .patient-grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 8px 15px;
        font-size: 11px;
      }
      
      .patient-field {
        display: flex;
        flex-direction: column;
      }
      
      .patient-field-label {
        font-weight: 600;
        color: #495057;
        margin-bottom: 2px;
      }
      
      .patient-field-value {
        color: #2c3e50;
        font-weight: 500;
        background: white;
        padding: 4px 6px;
        border-radius: 3px;
        border: 1px solid #dee2e6;
      }
      
      /* Assessment Sections */
      .content-container {
        display: grid;
        grid-template-columns: 1fr 1fr 200px;
        gap: 12px;
        margin-bottom: 20px; /* Reduced margin */
        min-height: auto;
      }
      
      .left-column {
        display: flex;
        flex-direction: column;
        gap: 10px;
      }
      
      .middle-column {
        display: flex;
        flex-direction: column;
        gap: 10px;
      }
      
      .right-column {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      
      .assessment-section {
        margin-bottom: 8px;
        page-break-inside: avoid;
      }
      
      .section-label {
        font-weight: bold;
        margin-bottom: 4px;
        color: #2c3e50;
        font-size: 11px;
        padding: 3px 6px;
        background: #e8f4f8;
        border-left: 4px solid #3498db;
        border-radius: 3px;
      }
      
      .section-content {
        margin-top: 4px;
        padding: 6px;
        font-size: 10px;
        line-height: 1.4;
        color: #2c3e50;
        background: white;
        border: 1px solid #dee2e6;
        border-radius: 4px;
        min-height: 30px;
        white-space: pre-wrap;
        word-wrap: break-word;
      }
      
      /* Vitals Grid */
      .vitals-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 6px;
        padding: 8px;
        background: white;
        border: 1px solid #dee2e6;
        border-radius: 4px;
      }
      
      .vital-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 4px 6px;
        background: #f8f9fa;
        border-radius: 3px;
        font-size: 10px;
      }
      
      .vital-label {
        font-weight: 600;
        color: #495057;
      }
      
      .vital-value {
        color: #2c3e50;
        font-weight: 500;
      }
      
      .bmi-status {
        font-weight: bold;
        font-size: 9px;
      }
      
      /* Pain Grid */
      .pain-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 6px;
        padding: 8px;
        background: white;
        border: 1px solid #dee2e6;
        border-radius: 4px;
      }
      
      .pain-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 4px 6px;
        background: #fff5f5;
        border-radius: 3px;
        font-size: 10px;
      }
      
      .pain-item.full-width {
        grid-column: 1 / -1;
        flex-direction: column;
        align-items: flex-start;
      }
      
      .pain-label {
        font-weight: 600;
        color: #495057;
      }
      
      .pain-value {
        color: #2c3e50;
        font-weight: 500;
      }
      
      /* Observation Grid */
      .obs-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 6px;
        padding: 8px;
        background: white;
        border: 1px solid #dee2e6;
        border-radius: 4px;
      }
      
      .obs-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 4px 6px;
        background: #f0f8f0;
        border-radius: 3px;
        font-size: 10px;
      }
      
      .obs-item.full-width {
        grid-column: 1 / -1;
        flex-direction: column;
        align-items: flex-start;
      }
      
      .obs-label {
        font-weight: 600;
        color: #495057;
      }
      
      .obs-value {
        color: #2c3e50;
        font-weight: 500;
      }
      
      /* BMI Chart Styles */
      .bmi-chart-section {
        margin: 15px 0;
        page-break-inside: avoid;
      }
      
      .bmi-chart {
        background: white;
        border: 1px solid #dee2e6;
        border-radius: 8px;
        padding: 12px;
      }
      
      .bmi-ranges {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 8px;
        margin-bottom: 15px;
      }
      
      .bmi-range {
        display: flex;
        align-items: center;
        padding: 6px;
        background: #f8f9fa;
        border-radius: 4px;
      }
      
      .bmi-color-bar {
        width: 15px;
        height: 15px;
        border-radius: 3px;
        margin-right: 8px;
      }
      
      .bmi-range-info {
        display: flex;
        flex-direction: column;
      }
      
      .bmi-range-label {
        font-weight: 600;
        font-size: 10px;
        color: #2c3e50;
      }
      
      .bmi-range-value {
        font-size: 9px;
        color: #6c757d;
        font-weight: 500;
      }
      
      .patient-bmi-indicator {
        margin-top: 12px;
      }
      
      .bmi-scale {
        position: relative;
      }
      
      .bmi-scale-bar {
        height: 20px;
        background: #f8f9fa;
        border-radius: 10px;
        overflow: hidden;
        position: relative;
        margin-bottom: 5px;
      }
      
      .bmi-sections {
        display: flex;
        height: 100%;
      }
      
      .bmi-section {
        height: 100%;
      }
      
      .bmi-pointer {
        position: absolute;
        top: -25px;
        transform: translateX(-50%);
        z-index: 10;
      }
      
      .bmi-pointer-arrow {
        color: #2c3e50;
        font-size: 14px;
        text-align: center;
        font-weight: bold;
      }
      
      .bmi-pointer-value {
        background: #2c3e50;
        color: white;
        padding: 2px 6px;
        border-radius: 3px;
        font-size: 9px;
        font-weight: bold;
        text-align: center;
        margin-top: 2px;
        min-width: 30px;
      }
      
      /* Body Diagram */
      .body-diagram-section {
        margin-bottom: 15px;
        text-align: center;
      }
      
      .body-diagram-title {
        font-weight: bold;
        margin-bottom: 6px;
        color: #2c3e50;
        font-size: 11px;
        padding: 3px 6px;
        background: #e8f4f8;
        border-left: 4px solid #3498db;
        border-radius: 3px;
        text-align: left;
      }
      
      .body-diagram {
        background-image: url('${bodyBase64}');
        background-size: contain;
        background-repeat: no-repeat;
        background-position: center;
        width: 180px;
        height: 220px;
        margin: 0 auto;
        border: 2px solid #dee2e6;
        border-radius: 8px;
        background-color: #f8f9fa;
      }
      
      /* Page Signature Section - Fixed positioning for every page */
      .page-signature {
        position: fixed;
        bottom: 25px; /* Positioned above footer */
        right: 15px;
        background: white;
        padding: 4px 8px;
        border-radius: 3px;
        border: 1px solid #dee2e6;
        font-size: 9px;
        text-align: center;
        width: 120px;
        z-index: 1000;
        box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      }
      
      .signature-text {
        font-style: italic;
        margin-bottom: 2px;
        color: #6c757d;
        font-size: 8px;
      }
      
      .signature-line {
        border-bottom: 1px solid #495057;
        width: 100px;
        margin: 4px auto 2px;
      }
      
      .signature-name {
        font-size: 8px;
        color: #495057;
        font-weight: 600;
      }
      
      /* Footer */
      .footer {
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        background: linear-gradient(135deg, #e74c3c, #c0392b);
        color: white;
        text-align: center;
        padding: 2px;
        font-size: 9px;
        font-weight: 600;
        letter-spacing: 0.3px;
        z-index: 1000;
        margin: 0;
      }
      
      @media print {
        body {
          print-color-adjust: exact;
          -webkit-print-color-adjust: exact;
        }
        
        .page {
          page-break-after: auto;
          margin-bottom: 0;
          padding-bottom: 20px;
        }
        
        .assessment-section {
          page-break-inside: avoid;
          break-inside: avoid;
        }
        
        .content-container {
          page-break-inside: auto;
        }
        
        .left-column, .middle-column {
          page-break-inside: auto;
        }
        
        .right-column {
          page-break-inside: avoid;
        }
        
        .body-diagram-section {
          page-break-inside: avoid;
        }
        
        .bmi-chart-section {
          page-break-inside: avoid;
        }
        
        /* Ensure header and patient info stay together */
        .header {
          page-break-after: avoid;
          page-break-inside: avoid;
        }
        
        .form-title {
          page-break-after: avoid;
          page-break-before: avoid;
        }
        
        .patient-info-container {
          page-break-after: avoid;
          page-break-before: avoid;
          page-break-inside: avoid;
        }
        
        .patient-info {
          page-break-inside: avoid;
        }
        
        /* Ensure signature and footer appear on every page */
        .page-signature {
          position: fixed;
          bottom: 25px;
          right: 15px;
          z-index: 1000;
        }
        
        .footer {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          z-index: 1000;
        }
        
        /* Prevent unnecessary page breaks */
        h1, h2, h3, h4, h5, h6 {
          page-break-after: avoid;
        }
      }
    </style>
  </head>
  <body>
  <div class="page">
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
          <p><strong>ADDRESS:</strong> 361/A, BASUDEVPUR ROAD, GROUND FLOOR - 'NILANJANA' APARTMENT</p>
          <p>SHYAMNAGAR, NORTH 24 PARGANAS, PIN - 743127</p>
          <p><strong>Tel:</strong> (033) 3564 7255 | <strong>Email:</strong> contacts@mstheracure.com</p>
          <p><strong>Website:</strong> www.mstheracure.com</p>
          <p style="margin-top: 5px; font-weight: bold;">Time: Monday to Saturday (9:00 AM to 7:00 PM)</p>
          <p style="font-weight: bold; color: #e74c3c;">SUNDAY CLOSED</p>
        </div>
      </div>
      
      <div class="doctor-info">
        <div class="doctor-name">
          ${therapist?.user?.name || therapist?.name || "Dr. Diksha Palit (PT)"}
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
          ${[
            {
              label: "Name",
              value:
                patientInfo?.patientName ||
                patientInfo?.name ||
                assessmentData?.patientName,
            },
            { label: "Age", value: patientInfo?.age || assessmentData?.age },
            {
              label: "Gender",
              value: patientInfo?.gender || assessmentData?.gender,
            },
            {
              label: "Patient ID",
              value:
                assessmentData?.patientId ||
                patientInfo?.id ||
                patientInfo?.patientId,
            },
            {
              label: "Height",
              value: assessmentData?.vitals?.height || patientInfo?.height,
            },
            {
              label: "Weight",
              value: assessmentData?.vitals?.weight || patientInfo?.weight,
            },
            {
              label: "Date",
              value:
                assessmentData?.assessmentDate ||
                assessmentData?.createdAt ||
                new Date(),
            },
          ]
            .filter((field) => field.value != null && field.value !== "")
            .map(
              (field) => `
              <div class="patient-field">
                <span class="patient-field-label">${field.label}:</span>
                <span class="patient-field-value">
                  ${
                    field.label === "Date"
                      ? new Date(field.value).toLocaleDateString("en-IN")
                      : field.value
                  }
                  ${field.label === "Height" ? " cms" : ""}
                  ${field.label === "Weight" ? " kgs" : ""}
                </span>
              </div>
            `
            )
            .join("")}
          
          ${
            assessmentData?.vitals?.weight && assessmentData?.vitals?.height
              ? `
            <div class="patient-field">
              <span class="patient-field-label">BMI:</span>
              <span class="patient-field-value">
                ${(() => {
                  const bmiData = getBMIData(
                    assessmentData.vitals.weight,
                    assessmentData.vitals.height
                  );
                  return bmiData
                    ? `${bmiData.bmi} kg/cm² <span style="color: ${bmiData.color}; font-weight: bold; font-size: 10px;">(${bmiData.status})</span>`
                    : "N/A";
                })()}
              </span>
            </div>`
              : ""
          }
        </div>
      </div>
    </div>
    
    <!-- Assessment Content -->
    <div class="content-container">
      <div class="left-column">
        ${renderVitalsSection()}

        ${[
          { label: "Chief Complaints", value: assessmentData?.chiefComplaints },
          {
            label: "History of Present Illness",
            value: assessmentData?.historyOfPresentIllness,
          },
          {
            label: "Past Medical History",
            value: assessmentData?.medicalHistory,
          },
          { label: "On Palpation", value: assessmentData?.onPalpation },
          { label: "Special Tests", value: assessmentData?.specialTests },
          { label: "Surgical History", value: assessmentData?.surgicalHistory },
          {
            label: "Occupational History",
            value: assessmentData?.occupationalHistory,
          },
          {
            label: "Environmental History",
            value: assessmentData?.environmentalHistory,
          },
          { label: "Additional Notes", value: assessmentData?.notes },
        ]
          .filter((s) => s.value != null && s.value !== "")
          .map((s) => renderSection(s.label, s.value))
          .join("")}

        ${renderPainHistory()}
        ${renderObservation()}
      </div>

      <div class="middle-column">
        ${Object.entries(assessmentData?.motorExamination || {})
          .filter(([_, val]) => val != null && val !== "")
          .map(([key, val]) =>
            renderSection(`Motor Examination - ${key.toUpperCase()}`, val)
          )
          .join("")}

        ${Object.entries(assessmentData?.neurologicalExam || {})
          .filter(([_, val]) => val != null && val !== "")
          .map(([key, val]) =>
            renderSection(`Neurological - ${key.toUpperCase()}`, val)
          )
          .join("")}

        ${[
          {
            label: "Differential Diagnosis",
            value: assessmentData?.differentialDiagnosis,
          },
          { label: "Investigations", value: assessmentData?.investigations },
          {
            label: "Provisional Diagnosis",
            value: assessmentData?.provisionalDiagnosis,
          },
          {
            label: "Physiotherapy Management",
            value: assessmentData?.physiotherapyMgmt,
          },
        ]
          .filter((s) => s.value != null && s.value !== "")
          .map((s) => renderSection(s.label, s.value))
          .join("")}
      </div>

      <div class="right-column">
        <div class="body-diagram-section">
          <div class="body-diagram-title">Body Diagram</div>
          <div class="body-diagram"></div>
        </div>

        ${renderBMIChart()}
      </div>
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
      top: "10mm",
      right: "10mm",
      bottom: "30mm",
      left: "10mm",
    },
    preferCSSPageSize: false,
    displayHeaderFooter: true,
    headerTemplate: "<div></div>",
    footerTemplate: `
      <div style="position: relative; width: 100%; font-size: 9px;">
        <!-- Signature Section -->
        <div style="position: absolute; bottom: 20px; right: 15px; background: white; padding: 4px 8px; border: 1px solid #dee2e6; border-radius: 3px; font-size: 8px; text-align: center; width: 120px;">
          <div style="font-style: italic; margin-bottom: 2px; color: #6c757d;">Doctor's Signature</div>
          <div style="border-bottom: 1px solid #495057; width: 100px; margin: 4px auto 2px;"></div>
          <div style="font-weight: 600; color: #495057;">${
            therapist?.user?.name || therapist?.name || "Dr. Diksha Palit (PT)"
          }</div>
        </div>
        <!-- Footer Section -->
        <div style="position: absolute; bottom: 0; left: 0; right: 0; background:rgb(222, 23, 23); color: white; text-align: center; padding: 2px; font-size: 9px; font-weight: 600;">
          IN CASE OF ANY EMERGENCY CONTACT THE NEAREST HOSPITAL IMMEDIATELY
        </div>
      </div>
    `,
  });

  await browser.close();
  return pdfBuffer;
};

export default generateAssessmentPDF;
