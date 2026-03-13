import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { consulationSchema } from "@/lib/validations/consulation";
import { ConsultationStatus } from "@prisma/client";
import { getSession } from "@/lib/auth/session-provider";

const ALLOWED_SORT_FIELDS = ["createdAt", "consultationDate", "status", "name"] as const;
type SortField = typeof ALLOWED_SORT_FIELDS[number];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const status = searchParams.get("status") as ConsultationStatus | null;
    const date = searchParams.get("date");
    const search = searchParams.get("search");
    const consultationWith = searchParams.get("consultationWith");
    const rawSortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") === "asc" ? "asc" : "desc";
    const sortBy: SortField = ALLOWED_SORT_FIELDS.includes(rawSortBy as SortField)
      ? (rawSortBy as SortField)
      : "createdAt";

    const offset = (page - 1) * limit;
    const where: any = {};

    if (status) where.status = status;
    if (date) {
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setDate(endDate.getDate() + 1);
      where.consultationDate = { gte: startDate, lt: endDate };
    }
    if (consultationWith) {
      where.consultationWith = { contains: consultationWith, mode: "insensitive" };
    }
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { mobileNumber: { contains: search, mode: "insensitive" } },
      ];
    }

    const [consultations, totalCount] = await Promise.all([
      prisma.consultation.findMany({
        where,
        skip: offset,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      }),
      prisma.consultation.count({ where }),
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({
      success: true,
      data: consultations,
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
      { success: false, error: "Failed to fetch consultations" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession(request);
    const body = await request.json();

    const result = consulationSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: "Invalid request body" },
        { status: 400 }
      );
    }

    const {
      name,
      email,
      phone,
      consultationDate,
      consultationTime,
      note,
      consultationwith,
    } = result.data;

    const existingConsultations = await prisma.consultation.findMany({
      where: {
        consultationDate: new Date(consultationDate),
        consultationTime,
        status: {
          notIn: [ConsultationStatus.CANCELLED, ConsultationStatus.COMPLETED],
        },
      },
    });

    if (existingConsultations.length > 0) {
      return NextResponse.json(
        { success: false, error: "Another consultation already exists for this date and time" },
        { status: 409 }
      );
    }

    const consultation = await prisma.consultation.create({
      data: {
        name: name.trim(),
        email: email?.toLowerCase().trim() || "",
        mobileNumber: phone.replace(/\D/g, ""),
        consultationDate: new Date(consultationDate),
        consultationTime,
        note: note?.trim() || "",
        consultationWith: consultationwith?.trim(),
        createdBy: session?.user?.id || body.createdById,
        status: "ASSIGNED",
      },
    });

    return NextResponse.json(
      { success: true, data: consultation, message: "Consultation created successfully" },
      { status: 201 }
    );
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to create consultation" },
      { status: 500 }
    );
  }
}
