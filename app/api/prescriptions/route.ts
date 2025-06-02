import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Query parameters for filtering and pagination
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search"); // Search by patient name, ID, or therapist
    const patientId = searchParams.get("patientId");
    const therapistId = searchParams.get("therapistId");
    const sessionId = searchParams.get("sessionId");
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") || "desc";

    // Calculate offset for pagination
    const offset = (page - 1) * limit;

    // Build where clause for filtering
    const where: any = {};

    if (patientId) {
      where.patientId = patientId;
    }

    if (therapistId) {
      where.therapistId = therapistId;
    }

    if (sessionId) {
      where.sessionId = sessionId;
    }

    if (search) {
      where.OR = [
        {
          patient: {
            patientName: { contains: search, mode: "insensitive" },
          },
        },
        {
          patient: {
            id: { contains: search, mode: "insensitive" },
          },
        },
        {
          therapist: {
            user: {
              name: { contains: search, mode: "insensitive" },
            },
          },
        },
        {
          prescriptionText: { contains: search, mode: "insensitive" },
        },
      ];
    }

    // Build orderBy clause
    const orderBy: any = {};
    orderBy[sortBy] = sortOrder;

    // Execute queries
    const [prescriptions, totalCount] = await Promise.all([
      prisma.prescription.findMany({
        where,
        skip: offset,
        take: limit,
        orderBy,
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
        },
      }),
      prisma.prescription.count({ where }),
    ]);

    // Calculate pagination info
    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return NextResponse.json({
      success: true,
      prescriptions,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        limit,
        hasNextPage,
        hasPrevPage,
      },
    });
  } catch (error) {
    console.error("Error fetching prescriptions:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch prescriptions",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    console.log("Creating prescription with data:", body);

    // Validate required fields
    const {
      sessionId,
      patientId,
      therapistId,
      prescriptionText,
      exercises,
      medications,
      restrictions,
      followUpDate,
    } = body;

    if (!sessionId || !patientId || !therapistId || !prescriptionText) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields",
          required: [
            "sessionId",
            "patientId",
            "therapistId",
            "prescriptionText",
          ],
        },
        { status: 400 }
      );
    }

    // Validate that related records exist
    const [session, patient, therapist] = await Promise.all([
      prisma.therapySession.findUnique({ where: { id: sessionId } }),
      prisma.patient.findUnique({ where: { id: patientId } }),
      prisma.therapist.findUnique({ where: { id: therapistId } }),
    ]);

    if (!session) {
      return NextResponse.json(
        { success: false, error: "Session not found" },
        { status: 404 }
      );
    }

    if (!patient) {
      return NextResponse.json(
        { success: false, error: "Patient not found" },
        { status: 404 }
      );
    }

    if (!therapist) {
      return NextResponse.json(
        { success: false, error: "Therapist not found" },
        { status: 404 }
      );
    }

    // Validate JSON fields if provided
    if (exercises && typeof exercises !== "object") {
      return NextResponse.json(
        { success: false, error: "Exercises must be a valid JSON object" },
        { status: 400 }
      );
    }

    if (medications && typeof medications !== "object") {
      return NextResponse.json(
        { success: false, error: "Medications must be a valid JSON object" },
        { status: 400 }
      );
    }

    // Create new prescription
    const prescription = await prisma.prescription.create({
      data: {
        sessionId,
        patientId,
        therapistId,
        prescriptionText: prescriptionText.trim(),
        exercises: exercises || null,
        medications: medications || null,
        restrictions: restrictions?.trim() || null,
        followUpDate: followUpDate ? new Date(followUpDate) : null,
      },
      include: {
        patient: {
          select: {
            id: true,
            patientName: true,
            age: true,
            gender: true,
            height: true,
            weigth: true,
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
            sessionType: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        success: true,
        prescription,
        message: "Prescription created successfully",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating prescription:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to create prescription",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
