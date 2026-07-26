import { prisma } from "@/lib/prisma";
import { patientUpdateSchema } from "@/lib/validations/patient";
import { NextRequest, NextResponse } from "next/server";
import { calculateAge } from "@/lib/utils/age-calculator";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const patient = await prisma.patient.findFirst({
      where: { id: { equals: id, mode: "insensitive" } },
    });

    if (!patient) {
      return NextResponse.json(
        { success: false, error: "Patient not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      patient: { ...patient, calculatedAge: calculateAge(patient.dateOfBirth) },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to fetch patient" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const body = await req.json();
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: "Patient ID is required" },
        { status: 400 }
      );
    }

    const result = patientUpdateSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid input", details: result.error.format() },
        { status: 400 }
      );
    }

    const existingPatient = await prisma.patient.findUnique({ where: { id } });

    if (!existingPatient) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 });
    }

    const { therapistAppointments, ...safeData } = result.data;

    const updateData: any = { ...safeData };

    if (safeData.dateOfBirth !== undefined) {
      const dob = safeData.dateOfBirth ? new Date(safeData.dateOfBirth) : null;
      updateData.dateOfBirth = dob;
      const calculatedAge = calculateAge(dob);
      if (calculatedAge) {
        updateData.age = calculatedAge.years;
      }
    }

    const patient = await prisma.patient.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      ...patient,
      calculatedAge: calculateAge(patient.dateOfBirth),
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to update patient" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: "Patient ID is required" },
        { status: 400 }
      );
    }

    const existingPatient = await prisma.patient.findUnique({ where: { id } });

    if (!existingPatient) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 });
    }

    await prisma.patient.delete({ where: { id } });

    return NextResponse.json(
      { message: "Patient deleted successfully" },
      { status: 200 }
    );
  } catch {
    return NextResponse.json(
      { error: "Failed to delete patient" },
      { status: 500 }
    );
  }
}
