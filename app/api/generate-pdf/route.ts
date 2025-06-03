import { NextRequest, NextResponse } from "next/server";
import generateAssessmentPDF from "@/lib/utils/PrescriptionPDFGenerator";
import generateInvoicePDF from "@/lib/utils/InvoicePDFGenerator";

const supportedTypes = ["invoice", "assessment"];

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    console.log("Generate pdf req: ", body);

    const { type } = body;

    if (!supportedTypes.includes(type)) {
      return new NextResponse(
        JSON.stringify({ error: "Unsupported PDF type" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const pdfBuffer =
      type === "invoice"
        ? await generateInvoicePDF(body)
        : await generateAssessmentPDF(body);

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename=${body.type}.pdf"`,
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
