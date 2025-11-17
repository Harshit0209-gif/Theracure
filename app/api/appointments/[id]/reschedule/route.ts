import { prisma } from "@/lib/prisma";
import { AppointmentStatus, Prisma } from "@prisma/client";
import { getDay } from "date-fns";
import { NextRequest, NextResponse } from "next/server";
import { sendSMSNotification } from "@/config/smsConfig";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    console.log("reschedule api calling body:", body);
    const { appointmentStartTime, appointmentEndTime, reason } = body;

    // Validate input
    if (!appointmentStartTime || !appointmentEndTime) {
      return NextResponse.json(
        { success: false, message: "Start time and end time are required" },
        { status: 400 }
      );
    }

    const startTime = new Date(appointmentStartTime);
    const endTime = new Date(appointmentEndTime);

    // Validate time format and future date
    if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
      return NextResponse.json(
        { success: false, message: "Invalid date format" },
        { status: 400 }
      );
    }

    if (startTime < new Date()) {
      return NextResponse.json(
        { success: false, message: "Cannot schedule appointments in the past" },
        { status: 400 }
      );
    }

    if (endTime <= startTime) {
      return NextResponse.json(
        { success: false, message: "End time must be after start time" },
        { status: 400 }
      );
    }

    const weekDay = getDay(startTime);

    // 1. Find therapist
    const therapistAssignment = await prisma.appointment.findUnique({
      where: { id },
      select: { therapistId: true },
    });

    if (!therapistAssignment?.therapistId) {
      return NextResponse.json(
        { success: false, message: "Appointment not found" },
        { status: 404 }
      );
    }
    console.log("therapist fetch from db", weekDay, therapistAssignment);

    // 2. Check if therapist has availability for this weekday
    const therapistAvailability = await prisma.therapistTimeSlot.findFirst({
      where: {
        therapistId: therapistAssignment.therapistId,
        weekDay,
        isAvailable: true,
        startTime: { lte: startTime.toTimeString().slice(0, 5) },
        endTime: { gte: endTime.toTimeString().slice(0, 5) },
      },
    });

    console.log("therapist avialable: ", weekDay, therapistAvailability);

    if (!therapistAvailability) {
      return NextResponse.json(
        { success: false, message: "Therapist is not available at this time" },
        { status: 400 }
      );
    }

    // 3. Check for existing appointments that overlap with the requested time
    const existingAppointments = await prisma.appointment.findMany({
      where: {
        therapistId: therapistAssignment.therapistId,
        status: { in: [AppointmentStatus.CONFIRMED] },
        id: { not: id },
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

    if (existingAppointments.length > 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Time slot conflicts with existing appointments",
        },
        { status: 400 }
      );
    }

    // 4. Update the appointment
    const appointment = await prisma.appointment.update({
      where: { id },
      data: {
        appointmentStartTime: startTime,
        appointmentEndTime: endTime,
        notes: reason,
      },
      include: {
        patient: {
          select: {
            id: true,
            patientName: true,
            phone: true,
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
      },
    });

    // Send SMS notification
    if (appointment.patient?.phone) {
      try {
        await sendSMSNotification("APPOINTMENT_RESCHEDULED", {
          phone: appointment.patient.phone,
          patientName: appointment.patient.patientName,
          therapistName: appointment.therapist.name,
          date: appointment.assignedDate,
          startTime: appointment.appointmentStartTime,
        });
      } catch (smsError) {
        console.error("Failed to queue SMS:", smsError);
      }
    }

    return NextResponse.json({
      success: true,
      message: "Rescheduled Successfully",
      data: appointment,
    });
  } catch (error) {
    console.error("Error rescheduling appointment:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
