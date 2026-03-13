import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import generateAssessmentPDF from "@/lib/utils/PrescriptionPDFGenerator";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Fetch prescription with all necessary data
    const prescription = await prisma.prescription.findUnique({
      where: { id },
      include: {
        patient: {
          select: {
            id: true,
            patientName: true,
            age: true,
            gender: true,
            phone: true,
            email: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        therapist: {
          select: {
            id: true,
            specialization: true,
            qualification: true,
            user: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
        session: {
          select: {
            id: true,
            sessionDate: true,
            sessionData: true,
            sessionNotes: true,
            completed: true,
          },
        },
      },
    });

    if (!prescription) {
      return NextResponse.json(
        { success: false, error: "Prescription not found" },
        { status: 404 }
      );
    }

    if (!prescription.session?.sessionData) {
      return NextResponse.json(
        { success: false, error: "No assessment data found for this prescription" },
        { status: 404 }
      );
    }

    // Parse assessment data
    const assessmentData = JSON.parse(prescription.session.sessionData);

    // Generate PDF
    const pdfBuffer = await generateAssessmentPDF({
      patientInfo: {
        id: prescription.patient?.id || "N/A",
        patientName: prescription.patient?.patientName || "Deleted Patient",
        age: prescription.patient?.age || 0,
        gender: prescription.patient?.gender || "Other",
        phone: prescription.patient?.phone || "",
        email: prescription.patient?.email || "",
        createdAt: prescription.patient?.createdAt || new Date(),
        updatedAt: prescription.patient?.updatedAt || new Date(),
      },
      assessmentData,
      therapist: prescription.therapist,
    });

    // Return PDF as response
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="assessment-${prescription.patient?.patientName || "deleted"}-${id}.pdf"`,
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    });
  } catch (error) {
    console.error("Error generating prescription PDF:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to generate PDF",
      },
      { status: 500 }
    );
  }
}
