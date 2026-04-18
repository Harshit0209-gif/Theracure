import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { AppointmentStatus, CubicleStatus } from "@prisma/client";
import { sendSMSNotification } from "@/config/smsConfig";
import { validateAppointmentDate } from "@/lib/utils/appointmentDateValidation";
import {
  formatTimeInClinicTimeZone,
  getClinicWeekDayFromDateTime,
} from "@/lib/utils/clinicDateTime";
import { getSession } from "@/lib/auth/session-provider";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const search = url.searchParams.get("search") || "";
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;
    const therapistId = url.searchParams.get("therapistId");

    const where: any = {};

    if (therapistId) where.therapistId = therapistId;
    if (search) {
      where.OR = [
        {
          patient: {
            patientName: { contains: search, mode: "insensitive" as const },
          },
        },
        { patient: { id: { contains: search, mode: "insensitive" as const } } },
        { patientId: null },
      ];
    }

    const [rawAppointments, totalCount] = await Promise.all([
      prisma.appointment.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          patient: {
            select: { id: true, patientName: true, phone: true, email: true },
          },
          therapist: {
            select: { id: true, name: true, email: true, phone: true },
          },
          createdBy: { select: { id: true, name: true, email: true } },
          service: {
            select: { id: true, name: true, category: true, price: true },
          },
          cubicle: {
            select: { id: true, name: true, roomNumber: true, location: true },
          },
        },
      }),
      prisma.appointment.count({ where }),
    ]);

    // Normalize deleted patients so frontend never receives null patient
    const appointments = rawAppointments.map((appt) => ({
      ...appt,
      patient: appt.patient ?? {
        id: "",
        patientName: "Deleted Patient",
        phone: null,
        email: null,
      },
    }));

    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({
      success: true,
      appointments,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        limit,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to fetch appointments" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession(req);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }
    const createdById = session.user.id;

    const body = await req.json();
    const {
      patientId,
      therapistId,
      appointmentStartTime,
      appointmentEndTime,
      notes,
      serviceId,
      appointmentDate,
      cubicleId,
    } = body;

    if (
      !patientId ||
      !therapistId ||
      !appointmentStartTime ||
      !appointmentEndTime ||
      !serviceId ||
      !appointmentDate
    ) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 },
      );
    }

    const startTime = new Date(appointmentStartTime);
    const endTime = new Date(appointmentEndTime);

    if (startTime >= endTime) {
      return NextResponse.json(
        { success: false, error: "End time must be after start time" },
        { status: 400 },
      );
    }

    // Block Sundays and holidays
    const dateError = await validateAppointmentDate(startTime);
    if (dateError) {
      return NextResponse.json(
        { success: false, error: dateError },
        { status: 400 },
      );
    }

    const startTimeStr = formatTimeInClinicTimeZone(startTime);
    const endTimeStr = formatTimeInClinicTimeZone(endTime);
    const weekDay = getClinicWeekDayFromDateTime(startTime);

    const therapist = await prisma.therapist.findUnique({
      where: { id: therapistId },
    });
    if (!therapist) {
      return NextResponse.json(
        { success: false, error: "Therapist not found" },
        { status: 404 },
      );
    }

    const therapistAvailability = await prisma.therapistTimeSlot.findFirst({
      where: {
        therapistId,
        weekDay,
        isAvailable: true,
        startTime: { lte: startTimeStr },
        endTime: { gte: endTimeStr },
      },
    });

    if (!therapistAvailability) {
      return NextResponse.json(
        {
          success: false,
          error: "Therapist is not available during this time slot",
        },
        { status: 400 },
      );
    }

    const therapistConflicts = await prisma.appointment.findFirst({
      where: {
        therapistId,
        status: AppointmentStatus.CONFIRMED,
        OR: [
          {
            AND: [
              { appointmentStartTime: { lte: startTime } },
              { appointmentEndTime: { gt: startTime } },
            ],
          },
          {
            AND: [
              { appointmentStartTime: { lt: endTime } },
              { appointmentEndTime: { gte: endTime } },
            ],
          },
          {
            AND: [
              { appointmentStartTime: { gte: startTime } },
              { appointmentEndTime: { lte: endTime } },
            ],
          },
        ],
      },
      select: { id: true },
    });

    if (therapistConflicts) {
      return NextResponse.json(
        {
          success: false,
          error: "Therapist already has an appointment during this time slot",
        },
        { status: 400 },
      );
    }

    const allCubicles = await prisma.cubicle.findMany({
      where: { status: CubicleStatus.ACTIVE },
      orderBy: { name: "asc" },
    });

    if (allCubicles.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "No active cubicles available. Please contact administrator.",
        },
        { status: 400 },
      );
    }

    const overlappingAppointments = await prisma.appointment.findMany({
      where: {
        status: AppointmentStatus.CONFIRMED,
        OR: [
          {
            AND: [
              { appointmentStartTime: { lte: startTime } },
              { appointmentEndTime: { gt: startTime } },
            ],
          },
          {
            AND: [
              { appointmentStartTime: { lt: endTime } },
              { appointmentEndTime: { gte: endTime } },
            ],
          },
          {
            AND: [
              { appointmentStartTime: { gte: startTime } },
              { appointmentEndTime: { lte: endTime } },
            ],
          },
        ],
      },
      select: { cubicleId: true },
    });

    const occupiedCubicleIds = overlappingAppointments
      .map((apt) => apt.cubicleId)
      .filter((id): id is string => id !== null);

    let selectedCubicle;

    if (cubicleId) {
      selectedCubicle = allCubicles.find((c) => c.id === cubicleId);
      if (!selectedCubicle) {
        return NextResponse.json(
          { success: false, error: "Selected cubicle not found or inactive" },
          { status: 400 },
        );
      }
      if (occupiedCubicleIds.includes(cubicleId)) {
        return NextResponse.json(
          {
            success: false,
            error: "Selected cubicle is not available during this time slot.",
          },
          { status: 400 },
        );
      }
    } else {
      selectedCubicle = allCubicles.find(
        (c) => !occupiedCubicleIds.includes(c.id),
      );
      if (!selectedCubicle) {
        return NextResponse.json(
          {
            success: false,
            error:
              "No cubicles available during this time. All rooms are occupied.",
            details: {
              totalCubicles: allCubicles.length,
              occupiedCubicles: occupiedCubicleIds.length,
            },
          },
          { status: 400 },
        );
      }
    }

    const appointment = await prisma.appointment.create({
      data: {
        appointmentStartTime: startTime,
        appointmentEndTime: endTime,
        notes,
        status: AppointmentStatus.CONFIRMED,
        assignedDate: new Date(appointmentDate),
        patient: { connect: { id: patientId } },
        therapist: { connect: { id: therapistId } },
        therapistInfo: { connect: { id: therapistId } },
        createdBy: { connect: { id: createdById } },
        service: serviceId ? { connect: { id: serviceId } } : undefined,
        cubicle: { connect: { id: selectedCubicle.id } },
      },
      include: { cubicle: true },
    });

    const [patient, therapistUser, service] = await Promise.all([
      prisma.patient.findUnique({ where: { id: patientId } }),
      prisma.user.findUnique({ where: { id: therapistId } }),
      serviceId
        ? prisma.service.findUnique({ where: { id: serviceId } })
        : null,
    ]);

    if (patient?.phone) {
      try {
        await sendSMSNotification("APPOINTMENT_CONFIRMATION", {
          phone: patient.phone,
          patientName: patient.patientName,
          therapistName: therapistUser?.name || "Doctor",
          serviceName: service?.name || "Therapy",
          date: appointment.assignedDate,
          startTime: appointment.appointmentStartTime,
          endTime: appointment.appointmentEndTime,
          cubicleInfo: appointment.cubicle
            ? `${appointment.cubicle.name}${appointment.cubicle.location ? ` (${appointment.cubicle.location})` : ""}`
            : undefined,
        });
      } catch {
        // SMS failure is non-fatal
      }
    }

    return NextResponse.json({ success: true, appointment });
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to create appointment" },
      { status: 500 },
    );
  }
}
