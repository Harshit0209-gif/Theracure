import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { getDay } from "date-fns";
import { AppointmentStatus } from "@prisma/client";
import { sendSMSNotification } from "@/config/smsConfig";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const search = url.searchParams.get("search") || "";
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;
    const therapistId = url.searchParams.get("therapistId");

    const where: any = {};

    if (therapistId) {
      where.therapistId = therapistId;
    }

    if (search) {
      where.OR = [
        {
          patient: {
            patientName: { contains: search, mode: "insensitive" as const },
          },
        },
        {
          patient: {
            id: { contains: search, mode: "insensitive" as const },
          },
        },
      ];
    }

    const [appointments, totalCount] = await Promise.all([
      prisma.appointment.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          patient: {
            select: {
              id: true,
              patientName: true,
              phone: true,
              email: true,
            },
          },
          therapist: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
            },
          },
          createdBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          service: {
            select: {
              id: true,
              name: true,
              category: true,
              price: true,
            },
          },
        },
      }),
      prisma.appointment.count({ where }),
    ]);

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
  } catch (error) {
    console.error("Error fetching appointments:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch appointments" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log("Appointment request body:", body);
    const {
      patientId,
      therapistId,
      appointmentStartTime,
      appointmentEndTime,
      notes,
      createdById,
      serviceId,
      appointmentDate,
    } = body;

    // Validate required fields
    if (
      !patientId ||
      !therapistId ||
      !appointmentStartTime ||
      !appointmentEndTime ||
      !createdById ||
      !serviceId ||
      !appointmentDate
    ) {
      console.log("Missing fields:", {
        patientId: !patientId,
        therapistId: !therapistId,
        appointmentStartTime: !appointmentStartTime,
        appointmentEndTime: !appointmentEndTime,
        createdById: !createdById,
      });
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields",
        },
        { status: 400 }
      );
    }

    // Convert string dates to Date objects
    const startTime = new Date(appointmentStartTime);
    const endTime = new Date(appointmentEndTime);

    // Format times to HH:mm string format for comparison
    const startTimeStr = startTime.toTimeString().slice(0, 5);
    const endTimeStr = endTime.toTimeString().slice(0, 5);

    console.log("Formatted times:", {
      startTimeStr,
      endTimeStr,
      weekDay: getDay(startTime),
    });

    // Validate date order
    if (startTime >= endTime) {
      console.log("Invalid date order:", {
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
      });
      return NextResponse.json(
        {
          success: false,
          error: "End time must be after start time",
        },
        { status: 400 }
      );
    }

    // Get the weekday (0-6) from the appointment date
    const weekDay = getDay(startTime);

    // 1. Check if therapist exists and has a profile
    const therapist = await prisma.therapist.findUnique({
      where: { id: therapistId },
    });

    if (!therapist) {
      console.log("Therapist not found:", therapistId);
      return NextResponse.json(
        {
          success: false,
          error: "Therapist not found",
        },
        { status: 404 }
      );
    }

    // 2. Check if therapist has availability for this weekday
    const therapistAvailability = await prisma.therapistTimeSlot.findFirst({
      where: {
        therapistId,
        weekDay,
        isAvailable: true,
        startTime: { lte: startTimeStr },
        endTime: { gte: endTimeStr },
      },
    });

    console.log("Therapist availability check:", {
      therapistId,
      weekDay,
      startTimeStr,
      endTimeStr,
      found: !!therapistAvailability,
    });

    if (!therapistAvailability) {
      return NextResponse.json(
        {
          success: false,
          error: "Therapist is not available during this time slot",
        },
        { status: 400 }
      );
    }

    // 3. Check for existing appointments that overlap with the requested time
    const existingAppointments = await prisma.appointment.findMany({
      where: {
        therapistId,
        status: { in: [AppointmentStatus.CONFIRMED] },
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
        ],
      },
    });

    console.log("Existing appointments check:", {
      found: existingAppointments.length,
      appointments: existingAppointments,
    });

    if (existingAppointments.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Therapist already has an appointment during this time",
        },
        { status: 400 }
      );
    }

    // 4. Create the appointment
    const appointment = await prisma.appointment.create({
      data: {
        appointmentStartTime: startTime,
        appointmentEndTime: endTime,
        notes,
        status: AppointmentStatus.CONFIRMED,
        assignedDate: new Date(appointmentDate),
        patient: {
          connect: { id: patientId },
        },
        therapist: {
          connect: { id: therapistId },
        },
        therapistInfo: {
          connect: { id: therapistId },
        },
        createdBy: {
          connect: { id: createdById },
        },
        service: serviceId
          ? {
              connect: { id: serviceId },
            }
          : undefined,
      },
    });

    console.log("Appointment created successfully:", appointment);

    // 5. Send SMS Notification to Patient
    const [patient, therapistUser, service] = await Promise.all([
      prisma.patient.findUnique({
        where: { id: patientId },
      }),
      prisma.user.findUnique({
        where: { id: therapistId },
      }),
      serviceId
        ? prisma.service.findUnique({
            where: { id: serviceId },
          })
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
        });
      } catch (smsError) {
        console.error("Failed to queue SMS:", smsError);
      }
    }

    return NextResponse.json({
      success: true,
      appointment,
    });
  } catch (error) {
    console.error("Error creating appointment:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to create appointment",
      },
      { status: 500 }
    );
  }
}
