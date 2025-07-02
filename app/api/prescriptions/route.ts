import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Query parameters for filtering and pagination
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search");
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
    const { patientId, therapistId, assessmentData } = body;

    if (!patientId || !therapistId) {
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
    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
    });

    if (!patient) {
      return NextResponse.json(
        { success: false, error: "Patient not found" },
        { status: 404 }
      );
    }

    const therapist = await prisma.therapist.findUnique({
      where: { id: therapistId },
    });
    console.log("therapist found:  ", therapist);
    if (!therapist) {
      return NextResponse.json(
        { success: false, error: "Therapist not found" },
        { status: 404 }
      );
    }

    //1. create a session if it doesn't exist
    const newSession = await prisma.therapySession.create({
      data: {
        patientId,
        therapistId,
        sessionNotes: assessmentData?.sessionNotes || "",
        sessionData: JSON.stringify(assessmentData || {}),
      },
    });
    //2. create a prescription if it doesn't exist
    //check if a prescription already exists for this session
    const existingPrescription = await prisma.prescription.findFirst({
      where: {
        sessionId: newSession.id,
      },
    });
    if (existingPrescription) {
      return NextResponse.json(
        {
          success: false,
          error: "Prescription already exists for this session",
        },
        { status: 400 }
      );
    }

    //create a new prescription
    const newPrescription = await prisma.prescription.create({
      data: {
        sessionId: newSession.id,
        patientId: patientId,
        therapistId: therapistId,
        followUpDate: body.followUpDate ? new Date(body.followUpDate) : null,
      },
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
        session: {
          select: {
            id: true,
            sessionDate: true,
          },
        },
      },
    });

    //3. return the created prescription
    return NextResponse.json(
      {
        success: true,
        newPrescription,
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
