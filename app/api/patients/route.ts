import { NextRequest, NextResponse } from "next/server";
import { prisma, withRetry } from "@/lib/prisma";
import {
  createPatientSchema,
  patientUpdateSchema,
} from "@/lib/validations/patient";
import { getSession } from "@/lib/auth/session-provider";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const therapistId = url.searchParams.get("therapistId");
    const search = url.searchParams.get("search") || "";
    const currentPage = parseInt(url.searchParams.get("currentPage") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "20");
    const skip = (currentPage - 1) * limit;

    let where: any = {};

    if (therapistId) {
      where.therapistAppointments = {
        some: { therapistId },
      };
    }

    if (search) {
      const searchConditions = {
        OR: [
          { patientName: { contains: search, mode: "insensitive" as const } },
          { email: { contains: search, mode: "insensitive" as const } },
          { phone: { contains: search, mode: "insensitive" as const } },
          { id: { contains: search, mode: "insensitive" as const } },
        ],
      };

      if (therapistId) {
        where.AND = [
          { therapistAppointments: { some: { therapistId } } },
          searchConditions,
        ];
      } else {
        where = searchConditions;
      }
    }

    const [patients, totalCount] = await withRetry(() =>
      Promise.all([
        prisma.patient.findMany({
          where,
          skip,
          take: limit,
          orderBy: { id: "desc" },
          include: {
            therapistAppointments: {
              include: {
                therapist: {
                  select: { id: true, name: true, email: true },
                },
              },
            },
          },
        }),
        prisma.patient.count({ where }),
      ])
    );

    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({
      success: true,
      patients,
      pagination: {
        currentPage,
        totalPages,
        totalCount,
        limit,
        hasNextPage: currentPage < totalPages,
        hasPrevPage: currentPage > 1,
      },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to fetch patients" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession(req);
    const body = await req.json();

    const result = createPatientSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid input", details: result.error.format() },
        { status: 400 }
      );
    }

    const existing = await prisma.patient.findFirst({
      where: { email: body.email, phone: body.phone },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Patient data already exists" },
        { status: 409 }
      );
    }

    const { data } = result;

    const patient = await prisma.patient.create({
      data: {
        patientName: data.patientName,
        email: data.email,
        phone: data.phone,
        address: data.address,
        age: data.age,
        gender: data.gender,
        height: data.height,
        weight: data.weight,
        medicalHistory: data.medicalHistory,
        createdBy: session?.user?.id || body.createdBy,
      },
    });

    return NextResponse.json(patient, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Failed to create patient" },
      { status: 500 }
    );
  }
}
