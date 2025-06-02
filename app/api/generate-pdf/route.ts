import { NextRequest, NextResponse } from "next/server";
import generateAssessmentPDF from "@/lib/utils/PrescriptionPDFGenerator";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    console.log("Generate pdf req: ", body);

    const pdfBuffer = await generateAssessmentPDF(body);

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'inline; filename="assessment.pdf"',
      },
    });
  } catch (err: any) {
    console.error("PDF generation error:", err.message);
    return new NextResponse(
      JSON.stringify({ error: "Failed to generate PDF" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
