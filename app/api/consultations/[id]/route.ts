import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ConsultationStatus } from "@prisma/client";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const consultation = await prisma.consultation.findUnique({
      where: { id },
    });

    if (!consultation) {
      return NextResponse.json(
        { success: false, error: "Consultation not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: consultation,
    });
  } catch (error) {
    console.error("Error fetching consultation:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch consultation",
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

    // Check if consultation exists
    const existingConsultation = await prisma.consultation.findUnique({
      where: { id },
    });

    if (!existingConsultation) {
      return NextResponse.json(
        { success: false, error: "Consultation not found" },
        { status: 404 }
      );
    }

    const updateData: any = {
      updatedAt: new Date(),
    };

    if (body.name !== undefined) {
      updateData.name = body.name.trim();
    }

    if (body.email !== undefined) {
      updateData.email = body.email.toLowerCase().trim();
    }

    if (body.mobileNumber !== undefined) {
      updateData.mobileNumber = body.mobileNumber.replace(/\D/g, "");
    }

    if (body.consultationDate !== undefined) {
      updateData.consultationDate = new Date(body.consultationDate);
    }

    if (body.consultationTime !== undefined) {
      updateData.consultationTime = body.consultationTime;
    }

    if (body.status !== undefined) {
      if (!Object.values(ConsultationStatus).includes(body.status)) {
        return NextResponse.json(
          {
            success: false,
            error: "Invalid status",
            validStatuses: Object.values(ConsultationStatus),
          },
          { status: 400 }
        );
      }
      updateData.status = body.status;
    }

    if (body.consultationWith !== undefined) {
      updateData.consultationWith = body.consultationWith?.trim() || null;
    }

    if (body.message !== undefined) {
      updateData.message = body.message?.trim() || null;
    }

    // Update consultation with only provided fields
    const updatedConsultation = await prisma.consultation.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      data: updatedConsultation,
      message: "Consultation updated successfully",
    });
  } catch (error) {
    console.error("Error updating consultation:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to update consultation",
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

    // Check if consultation exists
    const existingConsultation = await prisma.consultation.findUnique({
      where: { id },
    });

    if (!existingConsultation) {
      return NextResponse.json(
        { success: false, error: "Consultation not found" },
        { status: 404 }
      );
    }

    // Option 1: Hard delete (permanently remove from database)
    await prisma.consultation.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "Consultation deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting consultation:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to delete consultation",
      },
      { status: 500 }
    );
  }
}
