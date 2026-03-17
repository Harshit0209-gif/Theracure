import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session-provider";
import z from "zod";
import { emrService } from "@/lib/services/emr-service";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession(req);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { id } = await params;

    const validatedData = body;

    // Check if record exists and user has permission
    const existingRecord = await prisma.medicalRecord.findUnique({
      where: { id },
      include: {
        patient: true,
      },
    });

    if (!existingRecord) {
      return NextResponse.json(
        { success: false, error: "Medical record not found" },
        { status: 404 }
      );
    }

    // Check permissions
    const canEdit =
      session.user.role === "ADMIN" ||
      existingRecord.uploadedBy === session.user.id;

    if (!canEdit) {
      return NextResponse.json(
        { success: false, error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    // Update the record
    const updatedRecord = await prisma.medicalRecord.update({
      where: { id },
      data: validatedData,
      include: {
        patient: {
          select: {
            id: true,
            patientName: true,
          },
        },
        uploadedByUser: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      record: updatedRecord,
    });
  } catch (error) {
    console.error("EMR update error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation error",
          details: error.issues,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession(req);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;

    const canDelete =
      session.user.role === "ADMIN" || session.user.role === "THERAPIST";
    if (!canDelete) {
      return NextResponse.json(
        { success: false, error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    const res = await emrService.deleteFile(id);

    return NextResponse.json(res);
  } catch (error) {
    console.error("EMR delete error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
