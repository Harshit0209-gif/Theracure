import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const patientId = searchParams.get("patientId");
    const therapistId = searchParams.get("therapistId");
    const completed = searchParams.get("completed");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    const where: any = {};

    if (patientId) where.patientId = patientId;
    if (therapistId) where.therapistId = therapistId;
    if (completed !== null && completed !== undefined) {
      where.completed = completed === "true";
    }
    if (startDate || endDate) {
      where.sessionDate = {};
      if (startDate) where.sessionDate.gte = new Date(startDate);
      if (endDate) where.sessionDate.lte = new Date(endDate);
    }

    const skip = (page - 1) * limit;

    const [sessions, totalCount] = await Promise.all([
      prisma.therapySession.findMany({
        where,
        orderBy: { sessionDate: "desc" },
        skip,
        take: limit,
        include: {
          patient: {
            select: { id: true, patientName: true, phone: true, email: true },
          },
          therapist: {
            select: { id: true, user: { select: { name: true, email: true } } },
          },
          prescriptions: {
            select: { id: true, createdAt: true },
          },
        },
      }),
      prisma.therapySession.count({ where }),
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({
      success: true,
      sessions,
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
      { success: false, error: "Failed to fetch therapy sessions" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      patientId,
      therapistId,
      sessionNotes,
      sessionDate,
      sessionData,
      completed = false,
    } = body;

    if (!patientId || !therapistId) {
      return NextResponse.json(
        { success: false, error: "Patient ID and Therapist ID are required" },
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
        { success: false, error: "Therapist not found" },
        { status: 404 }
      );
    }

    const session = await prisma.therapySession.create({
      data: {
        patientId,
        therapistId,
        sessionNotes,
        sessionDate: sessionDate ? new Date(sessionDate) : new Date(),
        completed,
      },
      include: {
        patient: {
          select: { id: true, patientName: true, phone: true, email: true },
        },
        therapist: {
          select: { id: true, user: { select: { name: true, email: true } } },
        },
      },
    });

    return NextResponse.json({ success: true, session }, { status: 201 });
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to create therapy session" },
      { status: 500 }
    );
  }
}
