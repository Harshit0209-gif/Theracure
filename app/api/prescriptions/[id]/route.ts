import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

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
          },
        },
        therapist: {
          include: {
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

    return NextResponse.json({
      success: true,
      prescription,
    });
  } catch (error) {
    console.error("Error fetching prescription:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch prescription",
      },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Check if prescription exists
    const existingPrescription = await prisma.prescription.findUnique({
      where: { id },
    });

    if (!existingPrescription) {
      return NextResponse.json(
        { success: false, error: "Prescription not found" },
        { status: 404 }
      );
    }

    // Build update data object with only provided fields
    const updateData: any = {
      updatedAt: new Date(),
    };

    if (body.prescriptionText !== undefined) {
      updateData.prescriptionText = body.prescriptionText.trim();
    }

    if (body.exercises !== undefined) {
      if (body.exercises && typeof body.exercises !== "object") {
        return NextResponse.json(
          { success: false, error: "Exercises must be a valid JSON object" },
          { status: 400 }
        );
      }
      updateData.exercises = body.exercises;
    }

    if (body.medications !== undefined) {
      if (body.medications && typeof body.medications !== "object") {
        return NextResponse.json(
          { success: false, error: "Medications must be a valid JSON object" },
          { status: 400 }
        );
      }
      updateData.medications = body.medications;
    }

    if (body.restrictions !== undefined) {
      updateData.restrictions = body.restrictions?.trim() || null;
    }

    if (body.followUpDate !== undefined) {
      updateData.followUpDate = body.followUpDate
        ? new Date(body.followUpDate)
        : null;
    }

    if (body.pdfUrl !== undefined) {
      updateData.pdfUrl = body.pdfUrl?.trim() || null;
    }

    // Validate related IDs if they are being updated
    if (body.sessionId !== undefined) {
      const session = await prisma.therapySession.findUnique({
        where: { id: body.sessionId },
      });
      if (!session) {
        return NextResponse.json(
          { success: false, error: "Session not found" },
          { status: 404 }
        );
      }
      updateData.sessionId = body.sessionId;
    }

    if (body.patientId !== undefined) {
      const patient = await prisma.patient.findUnique({
        where: { id: body.patientId },
      });
      if (!patient) {
        return NextResponse.json(
          { success: false, error: "Patient not found" },
          { status: 404 }
        );
      }
      updateData.patientId = body.patientId;
    }

    if (body.therapistId !== undefined) {
      const therapist = await prisma.therapist.findUnique({
        where: { id: body.therapistId },
      });
      if (!therapist) {
        return NextResponse.json(
          { success: false, error: "Therapist not found" },
          { status: 404 }
        );
      }
      updateData.therapistId = body.therapistId;
    }

    // Update prescription with only provided fields
    const updatedPrescription = await prisma.prescription.update({
      where: { id },
      data: updateData,
      include: {
        patient: {
          select: {
            id: true,
            patientName: true,
            age: true,
            gender: true,
          },
        },
        therapist: {
          include: {
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
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      prescription: updatedPrescription,
      message: "Prescription updated successfully",
    });
  } catch (error) {
    console.error("Error updating prescription:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to update prescription",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check if prescription exists
    const existingPrescription = await prisma.prescription.findUnique({
      where: { id },
    });

    if (!existingPrescription) {
      return NextResponse.json(
        { success: false, error: "Prescription not found" },
        { status: 404 }
      );
    }

    // Delete prescription
    await prisma.prescription.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "Prescription deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting prescription:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to delete prescription",
      },
      { status: 500 }
    );
  }
}
