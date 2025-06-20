import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { patientSchema, patientUpdateSchema } from "@/lib/validations/patient";
import { generatePatientId } from "@/lib/utils/utils";

// GET all patients
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const search = url.searchParams.get("search") || "";
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    const where = search
      ? {
          OR: [
            { patientName: { contains: search, mode: "insensitive" as const } },
            { email: { contains: search, mode: "insensitive" as const } },
            { phone: { contains: search, mode: "insensitive" as const } },
            { id: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {};

    const [patients, total] = await Promise.all([
      prisma.patient.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.patient.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      patients,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        page,
        limit,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to fetch patients" },
      { status: 500 }
    );
  }
}

// POST create new patient
export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log("create patient body:", body);
    // Validate input
    const result = patientSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid input", details: result.error.format() },
        { status: 400 }
      );
    }

    // Check if user exists
    const user = await prisma.patient.findFirst({
      where: { email: body.email, phone: body.phone },
    });

    if (user) {
      return NextResponse.json(
        { error: "Patient data already exists" },
        { status: 404 }
      );
    }

    const patientId = generatePatientId();

    console.log("Generated id..", patientId);
    const { data } = result;

    // Create patient
    const patient = await prisma.patient.create({
      data: {
        id: patientId,
        patientName: data.patientName,
        email: data.email,
        phone: data.phone,
        address: data.address,
        age: data.age,
        gender: data.gender,
        height: data.height,
        weight: data.weight,
        medicalHistory: data.medicalHistory,
        createdBy: body.createdBy,
      },
    });

    return NextResponse.json(patient, { status: 201 });
  } catch (error) {
    console.error("Error creating patient:", error);
    return NextResponse.json(
      { error: "Failed to create patient" },
      { status: 500 }
    );
  }
}

// PUT update patient
export async function PUT(req: Request) {
  try {
    const body = await req.json();

    const { id, ...data } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Patient ID is required" },
        { status: 400 }
      );
    }

    // Validate input
    const result = patientUpdateSchema.safeParse(data);
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

// DELETE patient
export async function DELETE(req: Request) {
  try {
    const body = await req.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Patient ID is required" },
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
