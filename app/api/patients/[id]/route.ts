import { prisma } from "@/lib/prisma";
import { patientUpdateSchema } from "@/lib/validations/patient";
import { NextResponse } from "next/server";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const patient = await prisma.patient.findUnique({
      where: { id },
    });

    console.log("patient found in db", patient);

    if (!patient) {
      return NextResponse.json(
        {
          success: false,
          error: "Patient not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      patient,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch patient",
      },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const body = await req.json();

    const { id } = await params;
    const data = body;
    console.log("update patient body:", data, "id:", id);

    if (!id) {
      return NextResponse.json(
        { error: "Patient ID is required" },
        { status: 400 }
      );
    }

    // Validate input
    const result = patientUpdateSchema.safeParse(data);
    console.log("Validation result:", result);
    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid input", details: result.error.format() },
        { status: 400 }
      );
    }

    // Check if patient exists
    const existingPatient = await prisma.patient.findUnique({
      where: { id },
    });

    if (!existingPatient) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 });
    }

    // Update patient
    const patient = await prisma.patient.update({
      where: { id },
      data: result.data,
    });

    return NextResponse.json(patient);
  } catch (error) {
    console.error("Error updating patient:", error);
    return NextResponse.json(
      { error: "Failed to update patient" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
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

    const existingPatient = await prisma.patient.findUnique({
      where: { id },
    });

    if (!existingPatient) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 });
    }

    // Delete patient
    await prisma.patient.delete({
      where: { id },
    });

    return NextResponse.json(
      { message: "Patient deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting patient:", error);
    return NextResponse.json(
      { error: "Failed to delete patient" },
      { status: 500 }
    );
  }
}
