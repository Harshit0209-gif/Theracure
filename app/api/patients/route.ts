import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  createPatientSchema,
  patientUpdateSchema,
} from "@/lib/validations/patient";
import { generatePatientId } from "@/lib/utils/utils";

// GET all patients
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const therapistId = url.searchParams.get("therapistId");
    const search = url.searchParams.get("search") || "";
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    // Build the where clause
    let where: any = {};

    // If therapistId is provided, filter patients assigned to that therapist
    if (therapistId) {
      where.therapistAppointments = {
        some: {
          therapistId: therapistId,
        },
      };
    }

    // Add search functionality
    if (search) {
      const searchConditions = {
        OR: [
          { patientName: { contains: search, mode: "insensitive" as const } },
          { email: { contains: search, mode: "insensitive" as const } },
          { phone: { contains: search, mode: "insensitive" as const } },
          { id: { contains: search, mode: "insensitive" as const } },
        ],
      };

      // Combine therapist filter with search
      if (therapistId) {
        where.AND = [
          { therapistAppointments: { some: { therapistId: therapistId } } },
          searchConditions,
        ];
      } else {
        where = searchConditions;
      }
    }

    const [patients, total] = await Promise.all([
      prisma.patient.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          therapistAppointments: {
            include: {
              therapist: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
        },
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
    console.error("Error fetching patients:", error);
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

    const patientId = generatePatientId();
    body.id = patientId;
    console.log("Generated id..", patientId);

    const result = createPatientSchema.safeParse(body);
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
