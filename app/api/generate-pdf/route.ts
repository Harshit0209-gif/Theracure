import { NextRequest, NextResponse } from "next/server";
import generateAssessmentPDF from "@/lib/utils/PrescriptionPDFGenerator";
import generateInvoicePDF from "@/lib/utils/InvoicePDFGenerator";
import { prisma } from "@/lib/prisma";

const supportedTypes = ["invoice", "assessment"];

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const { type, therapistId } = body;

    if (!supportedTypes.includes(type)) {
      return new NextResponse(
        JSON.stringify({ error: "Unsupported PDF type" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
    const therapist = type === "assessment"
      ? await prisma.therapist.findUnique({
          where: { id: therapistId },
          select: {
            specialization: true,
            qualification: true,
            user: { select: { name: true, email: true } },
          },
        })
      : null;

    const pdfBuffer =
      type === "invoice"
        ? await generateInvoicePDF(body)
        : await generateAssessmentPDF({
            patientInfo: body.patientInfo,
            assessmentData: body.assessmentData,
            therapist,
          });

    return new NextResponse(Buffer.from(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${body.type}.pdf"`,
      },
    });
  } catch (err: any) {
    console.error("PDF generation error:", err?.message || err);
    return new NextResponse(
      JSON.stringify({ error: "Failed to generate PDF", detail: err instanceof Error ? err.message : String(err) }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
