import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import z from "zod";

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const validatedData = UpdateMedicalRecordSchema.parse(body);

    // Check if record exists and user has permission
    const existingRecord = await prisma.MedicalRecord.findUnique({
      where: { id: params.id },
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
      existingRecord.uploadedBy === session.user.id ||
      (existingRecord.accessPermissions as any)?.canView?.includes(
        session.user.id
      );

    if (!canEdit) {
      return NextResponse.json(
        { success: false, error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    // Update the record
    const updatedRecord = await prisma.medicalRecord.update({
      where: { id: params.id },
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
          details: error.errors,
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
