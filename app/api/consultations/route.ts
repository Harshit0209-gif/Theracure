import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Enum for consultation status
enum ConsultationStatus {
  NOT_ASSIGN = "NOT_ASSIGN",
  ASSIGNED = "ASSIGNED",
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    console.log("parameter  ", searchParams);

    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const status = searchParams.get("status") as ConsultationStatus | null;
    const date = searchParams.get("date");
    const search = searchParams.get("search");
    const consultationWith = searchParams.get("consultationWith");
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") || "desc";

    const offset = (page - 1) * limit;

    // Build where clause for filtering
    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (date) {
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setDate(endDate.getDate() + 1);

      where.consultationDate = {
        gte: startDate,
        lt: endDate,
      };
    }

    if (consultationWith) {
      where.consultationWith = {
        contains: consultationWith,
        mode: "insensitive",
      };
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { mobileNumber: { contains: search, mode: "insensitive" } },
      ];
    }

    // Build orderBy clause
    const orderBy: any = {};
    orderBy[sortBy] = sortOrder;

    // Execute queries
    const [consultations, totalCount] = await Promise.all([
      prisma.consultation.findMany({
        where,
        skip: offset,
        take: limit,
        orderBy,
      }),
      prisma.consultation.count({ where }),
    ]);

    // Calculate pagination info
    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return NextResponse.json({
      success: true,
      data: consultations,
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
    console.error("Error fetching consultations:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch consultations",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      name,
      email,
      mobileNumber,
      consultationDate,
      consultationTime,
      message,
      consultationWith,
    } = body;

    if (
      !name ||
      !email ||
      !mobileNumber ||
      !consultationDate ||
      !consultationTime
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields",
          required: [
            "name",
            "email",
            "mobileNumber",
            "consultationDate",
            "consultationTime",
          ],
        },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, error: "Invalid email format" },
        { status: 400 }
      );
    }

    // Validate mobile number (basic validation)
    const mobileRegex = /^[0-9]{10}$/;
    if (!mobileRegex.test(mobileNumber.replace(/\D/g, ""))) {
      return NextResponse.json(
        { success: false, error: "Mobile number must be 10 digits" },
        { status: 400 }
      );
    }

    // Check for duplicate consultation (same person, same date/time)
    const existingConsultation = await prisma.consultation.findFirst({
      where: {
        email,
        consultationDate: new Date(consultationDate),
        consultationTime,
        status: {
          not: "CANCELLED",
        },
      },
    });

    if (existingConsultation) {
      return NextResponse.json(
        {
          success: false,
          error: "Consultation already exists for this date and time",
        },
        { status: 409 }
      );
    }

    // Create new consultation
    const consultation = await prisma.consultation.create({
      data: {
        name: name.trim(),
        email: email.toLowerCase().trim(),
        mobileNumber: mobileNumber.replace(/\D/g, ""), // Remove non-digits
        consultationDate: new Date(consultationDate),
        consultationTime,
        message: message?.trim() || null,
        consultationWith: consultationWith?.trim() || null,
        status: "NOT_ASSIGN",
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: consultation,
        message: "Consultation created successfully",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating consultation:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to create consultation",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
