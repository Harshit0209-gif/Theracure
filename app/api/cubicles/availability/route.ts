import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { AppointmentStatus, CubicleStatus } from "@prisma/client";

// GET /api/cubicles/availability - Check cubicle availability for a time range
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const startTime = url.searchParams.get("startTime");
    const endTime = url.searchParams.get("endTime");
    const excludeAppointmentId = url.searchParams.get("excludeAppointmentId");

    if (!startTime || !endTime) {
      return NextResponse.json(
        {
          success: false,
          error: "startTime and endTime are required parameters",
        },
        { status: 400 }
      );
    }

    const start = new Date(startTime);
    const end = new Date(endTime);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid date format for startTime or endTime",
        },
        { status: 400 }
      );
    }

    if (start >= end) {
      return NextResponse.json(
        {
          success: false,
          error: "endTime must be after startTime",
        },
        { status: 400 }
      );
    }

    // Get all active cubicles
    const allCubicles = await prisma.cubicle.findMany({
      where: {
        status: CubicleStatus.ACTIVE,
      },
      orderBy: {
        name: "asc",
      },
    });

    // Find appointments that overlap with the requested time range
    const overlappingAppointments = await prisma.appointment.findMany({
      where: {
        status: AppointmentStatus.CONFIRMED,
        ...(excludeAppointmentId && { id: { not: excludeAppointmentId } }),
        OR: [
          {
            AND: [
              { appointmentStartTime: { lte: start } },
              { appointmentEndTime: { gt: start } },
            ],
          },
          {
            AND: [
              { appointmentStartTime: { lt: end } },
              { appointmentEndTime: { gte: end } },
            ],
          },
          {
            AND: [
              { appointmentStartTime: { gte: start } },
              { appointmentEndTime: { lte: end } },
            ],
          },
        ],
      },
      select: {
        cubicleId: true,
        appointmentStartTime: true,
        appointmentEndTime: true,
        patient: {
          select: {
            patientName: true,
          },
        },
      },
    });

    // Get occupied cubicle IDs
    const occupiedCubicleIds = overlappingAppointments
      .map((apt) => apt.cubicleId)
      .filter((id): id is string => id !== null);

    // Get all appointments for today for each cubicle (for booking timeline)
    const startOfDay = new Date(start);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(start);
    endOfDay.setHours(23, 59, 59, 999);

    const todayAppointments = await prisma.appointment.findMany({
      where: {
        status: AppointmentStatus.CONFIRMED,
        appointmentStartTime: { gte: startOfDay, lte: endOfDay },
      },
      select: {
        cubicleId: true,
        appointmentStartTime: true,
        appointmentEndTime: true,
        patient: {
          select: {
            patientName: true,
          },
        },
      },
      orderBy: {
        appointmentStartTime: "asc",
      },
    });

    // Group bookings by cubicle
    const bookingsByCubicle = todayAppointments.reduce((acc, apt) => {
      if (apt.cubicleId) {
        if (!acc[apt.cubicleId]) {
          acc[apt.cubicleId] = [];
        }
        acc[apt.cubicleId].push({
          startTime: apt.appointmentStartTime.toISOString(),
          endTime: apt.appointmentEndTime.toISOString(),
          patientName: apt.patient?.patientName,
        });
      }
      return acc;
    }, {} as Record<string, any[]>);

    // Separate available and occupied cubicles
    const availableCubicles = allCubicles
      .filter((cubicle) => !occupiedCubicleIds.includes(cubicle.id))
      .map((cubicle) => ({
        ...cubicle,
        bookings: bookingsByCubicle[cubicle.id] || [],
      }));

    const occupiedCubicles = allCubicles
      .filter((cubicle) => occupiedCubicleIds.includes(cubicle.id))
      .map((cubicle) => {
        const appointment = overlappingAppointments.find(
          (apt) => apt.cubicleId === cubicle.id
        );
        return {
          ...cubicle,
          occupiedBy: appointment?.patient?.patientName || "Unknown",
          occupiedFrom: appointment?.appointmentStartTime,
          occupiedUntil: appointment?.appointmentEndTime,
          bookings: bookingsByCubicle[cubicle.id] || [],
        };
      });

    return NextResponse.json({
      success: true,
      availability: {
        totalCubicles: allCubicles.length,
        availableCount: availableCubicles.length,
        occupiedCount: occupiedCubicles.length,
        availableCubicles,
        occupiedCubicles,
        hasAvailability: availableCubicles.length > 0,
      },
      timeRange: {
        start: start.toISOString(),
        end: end.toISOString(),
      },
    });
  } catch (error) {
    console.error("Error checking cubicle availability:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to check cubicle availability",
      },
      { status: 500 }
    );
  }
}

// POST /api/cubicles/availability - Check availability (alternative method with body)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { startTime, endTime, excludeAppointmentId } = body;

    if (!startTime || !endTime) {
      return NextResponse.json(
        {
          success: false,
          error: "startTime and endTime are required fields",
        },
        { status: 400 }
      );
    }

    const start = new Date(startTime);
    const end = new Date(endTime);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid date format for startTime or endTime",
        },
        { status: 400 }
      );
    }

    if (start >= end) {
      return NextResponse.json(
        {
          success: false,
          error: "endTime must be after startTime",
        },
        { status: 400 }
      );
    }

    // Get all active cubicles
    const allCubicles = await prisma.cubicle.findMany({
      where: {
        status: CubicleStatus.ACTIVE,
      },
      orderBy: {
        name: "asc",
      },
    });

    // Find appointments that overlap with the requested time range
    const overlappingAppointments = await prisma.appointment.findMany({
      where: {
        status: AppointmentStatus.CONFIRMED,
        ...(excludeAppointmentId && { id: { not: excludeAppointmentId } }),
        OR: [
          {
            AND: [
              { appointmentStartTime: { lte: start } },
              { appointmentEndTime: { gt: start } },
            ],
          },
          {
            AND: [
              { appointmentStartTime: { lt: end } },
              { appointmentEndTime: { gte: end } },
            ],
          },
          {
            AND: [
              { appointmentStartTime: { gte: start } },
              { appointmentEndTime: { lte: end } },
            ],
          },
        ],
      },
      select: {
        cubicleId: true,
        appointmentStartTime: true,
        appointmentEndTime: true,
        patient: {
          select: {
            patientName: true,
          },
        },
      },
    });

    // Get occupied cubicle IDs
    const occupiedCubicleIds = overlappingAppointments
      .map((apt) => apt.cubicleId)
      .filter((id): id is string => id !== null);

    // Get all appointments for today for each cubicle (for booking timeline)
    const startOfDay = new Date(start);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(start);
    endOfDay.setHours(23, 59, 59, 999);

    const todayAppointments = await prisma.appointment.findMany({
      where: {
        status: AppointmentStatus.CONFIRMED,
        appointmentStartTime: { gte: startOfDay, lte: endOfDay },
      },
      select: {
        cubicleId: true,
        appointmentStartTime: true,
        appointmentEndTime: true,
        patient: {
          select: {
            patientName: true,
          },
        },
      },
      orderBy: {
        appointmentStartTime: "asc",
      },
    });

    // Group bookings by cubicle
    const bookingsByCubicle = todayAppointments.reduce((acc, apt) => {
      if (apt.cubicleId) {
        if (!acc[apt.cubicleId]) {
          acc[apt.cubicleId] = [];
        }
        acc[apt.cubicleId].push({
          startTime: apt.appointmentStartTime.toISOString(),
          endTime: apt.appointmentEndTime.toISOString(),
          patientName: apt.patient?.patientName,
        });
      }
      return acc;
    }, {} as Record<string, any[]>);

    // Separate available and occupied cubicles
    const availableCubicles = allCubicles
      .filter((cubicle) => !occupiedCubicleIds.includes(cubicle.id))
      .map((cubicle) => ({
        ...cubicle,
        bookings: bookingsByCubicle[cubicle.id] || [],
      }));

    const occupiedCubicles = allCubicles
      .filter((cubicle) => occupiedCubicleIds.includes(cubicle.id))
      .map((cubicle) => {
        const appointment = overlappingAppointments.find(
          (apt) => apt.cubicleId === cubicle.id
        );
        return {
          ...cubicle,
          occupiedBy: appointment?.patient?.patientName || "Unknown",
          occupiedFrom: appointment?.appointmentStartTime,
          occupiedUntil: appointment?.appointmentEndTime,
          bookings: bookingsByCubicle[cubicle.id] || [],
        };
      });

    return NextResponse.json({
      success: true,
      availability: {
        totalCubicles: allCubicles.length,
        availableCount: availableCubicles.length,
        occupiedCount: occupiedCubicles.length,
        availableCubicles,
        occupiedCubicles,
        hasAvailability: availableCubicles.length > 0,
      },
      timeRange: {
        start: start.toISOString(),
        end: end.toISOString(),
      },
    });
  } catch (error) {
    console.error("Error checking cubicle availability:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to check cubicle availability",
      },
      { status: 500 }
    );
  }
}
