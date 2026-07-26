import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { AppointmentStatus, Prisma } from "@prisma/client";
import { sendSMSNotification } from "@/config/smsConfig";
import { validateAppointmentDate } from "@/lib/utils/appointmentDateValidation";
import { getSession } from "@/lib/auth/session-provider";
import {
  getClinicDateKey,
  getCubicleAvailabilityForSlot,
  isValidDate,
  isTherapistWorkingDuringSlot,
} from "@/lib/utils/appointmentScheduling";

function getTodayISTWindow(): { start: Date; end: Date } {
  const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
  const nowUTC = Date.now();
  const nowIST = nowUTC + IST_OFFSET_MS;
  const startOfDayIST = nowIST - (nowIST % (24 * 60 * 60 * 1000));
  const start = new Date(startOfDayIST - IST_OFFSET_MS);
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
  return { start, end };
}

type AppointmentView = "today" | "upcoming" | "all";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const search = url.searchParams.get("search") || "";
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;
    const therapistId = url.searchParams.get("therapistId");
    const view = (url.searchParams.get("view") ||
      "today") as AppointmentView;

    const category = url.searchParams.get("category");

    const where: any = {};

    if (therapistId) where.therapistId = therapistId;
    if (category) {
      where.services = { some: { service: { category } } };
    }
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

    const date = url.searchParams.get("date");

    if (date && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
      const start = new Date(`${date}T00:00:00+05:30`);
      const end = new Date(`${date}T23:59:59.999+05:30`);
      if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
        where.appointmentStartTime = { gte: start, lte: end };
      }
    } else {
      if (view === "today") {
        const { start, end } = getTodayISTWindow();
        where.appointmentStartTime = { gte: start, lt: end };
      } else if (view === "upcoming") {
        const { end } = getTodayISTWindow();
        where.appointmentStartTime = { gte: end };
      }
    }

    const orderBy =
      view === "all" && !date
        ? [
            { appointmentStartTime: "desc" as const },
            { createdAt: "desc" as const },
          ]
        : [
            { appointmentStartTime: "asc" as const },
            { createdAt: "asc" as const },
          ];

    const include = {
      patient: {
        select: { id: true, patientName: true, phone: true, email: true },
      },
      therapist: {
        select: { id: true, name: true, email: true, phone: true },
      },
      createdBy: { select: { id: true, name: true, email: true } },
      services: {
        include: {
          service: {
            select: { id: true, name: true, category: true, price: true },
          },
        },
      },
      cubicle: {
        select: { id: true, name: true, roomNumber: true, location: true },
      },
    };

    const [rawAppointments, totalCount] = await Promise.all([
      prisma.appointment.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include,
      }),
      prisma.appointment.count({ where }),
    ]);

    const appointments = rawAppointments.map((appt) => ({
      ...appt,
      patient: appt.patient ?? {
        id: "",
        patientName: "Deleted Patient",
        phone: null,
        email: null,
      },
      services: appt.services.map((s) => s.service),
    }));

    const totalPages = Math.max(1, Math.ceil(totalCount / limit));

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
      serviceIds,
      appointmentDate,
      cubicleId,
    } = body;

    if (
      !patientId ||
      !therapistId ||
      !appointmentStartTime ||
      !appointmentEndTime ||
      !Array.isArray(serviceIds) ||
      serviceIds.length === 0 ||
      !appointmentDate
    ) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 },
      );
    }

    const startTime = new Date(appointmentStartTime);
    const endTime = new Date(appointmentEndTime);
    if (!isValidDate(startTime) || !isValidDate(endTime)) {
      return NextResponse.json(
        { success: false, error: "Invalid appointment date/time format" },
        { status: 400 },
      );
    }

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

    if (getClinicDateKey(startTime) !== appointmentDate) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Appointment date must match appointment start time in clinic timezone",
        },
        { status: 400 },
      );
    }

    const uniqueServiceIds = [...new Set(serviceIds as string[])];

    const [patient, therapist, services] = await Promise.all([
      prisma.patient.findUnique({
        where: { id: patientId },
        select: { id: true },
      }),
      prisma.therapist.findUnique({
        where: { id: therapistId },
        select: { id: true },
      }),
      prisma.service.findMany({
        where: { id: { in: uniqueServiceIds } },
        select: { id: true },
      }),
    ]);

    if (!patient) {
      return NextResponse.json(
        { success: false, error: "Patient not found" },
        { status: 404 },
      );
    }
    if (!therapist) {
      return NextResponse.json(
        { success: false, error: "Therapist not found" },
        { status: 404 },
      );
    }
    if (services.length !== uniqueServiceIds.length) {
      return NextResponse.json(
        { success: false, error: "Service not found" },
        { status: 404 },
      );
    }

    const therapistAvailability = await isTherapistWorkingDuringSlot(
      prisma,
      therapistId,
      startTime,
      endTime,
    );
    if (!therapistAvailability) {
      return NextResponse.json(
        {
          success: false,
          error: "Therapist is not available during this time slot",
        },
        { status: 400 },
      );
    }

    let appointment;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        appointment = await prisma.$transaction(
          async (tx) => {
            const cubicleAvailability = await getCubicleAvailabilityForSlot(
              tx,
              startTime,
              endTime,
              cubicleId,
            );
            const allCubicles = cubicleAvailability.allCubicles;

            if (allCubicles.length === 0) {
              throw new Error("NO_CUBICLE");
            }

            if (
              !cubicleAvailability.hasAvailableCubicle ||
              !cubicleAvailability.selectedCubicle
            ) {
              throw new Error("NO_CUBICLE");
            }

            return tx.appointment.create({
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
                services: {
                  create: uniqueServiceIds.map((id) => ({
                    service: { connect: { id } },
                  })),
                },
                cubicle: {
                  connect: { id: cubicleAvailability.selectedCubicle.id },
                },
              },
              include: { cubicle: true },
            });
          },
          { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
        );
        break;
      } catch (error) {
        if (error instanceof Error && error.message === "NO_CUBICLE") {
          break;
        }
        const code = (error as { code?: string })?.code;
        if (code === "P2034" && attempt < 2) {
          continue;
        }
        throw error;
      }
    }

    if (!appointment) {
      return NextResponse.json(
        {
          success: false,
          error: "Unable to allocate cubicle for this slot",
        },
        { status: 409 },
      );
    }

    const [patientDetails, therapistUser, serviceDetails] = await Promise.all([
      prisma.patient.findUnique({ where: { id: patientId } }),
      prisma.user.findUnique({ where: { id: therapistId } }),
      prisma.service.findMany({ where: { id: { in: uniqueServiceIds } } }),
    ]);

    if (patientDetails?.phone) {
      try {
        await sendSMSNotification("APPOINTMENT_CONFIRMATION", {
          phone: patientDetails.phone,
          patientName: patientDetails.patientName,
          therapistName: therapistUser?.name || "Doctor",
          serviceName:
            serviceDetails.map((s) => s.name).join(", ") || "Therapy",
          date: appointment.appointmentStartTime,
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
