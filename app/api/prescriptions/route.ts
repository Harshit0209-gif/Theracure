import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const ALLOWED_SORT_FIELDS = ["createdAt", "updatedAt", "sessionId"] as const;
type SortField = typeof ALLOWED_SORT_FIELDS[number];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const search = searchParams.get("search");
    const patientId = searchParams.get("patientId");
    const therapistId = searchParams.get("therapistId");
    const sessionId = searchParams.get("sessionId");
    const rawSortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") === "asc" ? "asc" : "desc";
    const sortBy: SortField = ALLOWED_SORT_FIELDS.includes(rawSortBy as SortField)
      ? (rawSortBy as SortField)
      : "createdAt";

    const offset = (page - 1) * limit;
    const where: any = {};

    if (patientId) where.patientId = patientId;
    if (therapistId) where.therapistId = therapistId;
    if (sessionId) where.sessionId = sessionId;
    if (search) {
      where.OR = [
        { patient: { patientName: { contains: search, mode: "insensitive" } } },
        { patient: { id: { contains: search, mode: "insensitive" } } },
        { therapist: { user: { name: { contains: search, mode: "insensitive" } } } },
      ];
    }

    const [prescriptions, totalCount] = await Promise.all([
      prisma.prescription.findMany({
        where,
        skip: offset,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          patient: { select: { id: true, patientName: true } },
          therapist: {
            include: { user: { select: { name: true, email: true } } },
          },
          session: { select: { id: true, sessionDate: true, completed: true } },
        },
      }),
      prisma.prescription.count({ where }),
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({
      success: true,
      prescriptions,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to fetch prescriptions" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { patientId, therapistId, assessmentData } = body;

    if (!patientId || !therapistId) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields",
          required: ["patientId", "therapistId"],
        },
        { status: 400 }
      );
    }

    const patient = await prisma.patient.findUnique({ where: { id: patientId } });
    if (!patient) {
      return NextResponse.json(
        { success: false, error: "Patient not found" },
        { status: 404 }
      );
    }

    const therapist = await prisma.therapist.findUnique({ where: { id: therapistId } });
    if (!therapist) {
      return NextResponse.json(
        { success: false, error: "Therapist profile not found" },
        { status: 404 }
      );
    }

    const newSession = await prisma.therapySession.create({
      data: {
        patientId,
        therapistId,
        sessionNotes: assessmentData?.notes || "",
        sessionData: JSON.stringify(assessmentData || {}),
        completed: true,
      },
    });

    const existingPrescription = await prisma.prescription.findFirst({
      where: { sessionId: newSession.id },
    });

    if (existingPrescription) {
      return NextResponse.json(
        { success: false, error: "Prescription already exists for this session" },
        { status: 400 }
      );
    }

    const newPrescription = await prisma.prescription.create({
      data: { sessionId: newSession.id, patientId, therapistId },
      include: {
        patient: { select: { id: true, patientName: true, age: true, gender: true } },
        therapist: {
          include: { user: { select: { name: true, email: true } } },
        },
        session: { select: { id: true, sessionDate: true } },
      },
    });

    return NextResponse.json(
      { success: true, newPrescription, message: "Prescription created successfully" },
      { status: 201 }
    );
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to create prescription" },
      { status: 500 }
    );
  }
}
