import { prisma } from "@/lib/prisma";
import { AppointmentStatus } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const appointment = await prisma.appointment.findUnique({
      where: { id },
      include: {
        patient: {
          select: { id: true, patientName: true, phone: true, email: true },
        },
        therapist: {
          select: { id: true, name: true, email: true, phone: true },
        },
        createdBy: { select: { name: true } },
        cubicle: {
          select: { id: true, name: true, roomNumber: true, location: true },
        },
        services: {
          include: {
            service: {
              select: { id: true, name: true, category: true, price: true },
            },
          },
        },
        invoice: {
          select: { id: true, status: true, totalAmount: true, amountPaid: true },
        },
      },
    });

    if (!appointment) {
      return NextResponse.json(
        { success: false, error: "Appointment not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      appointment: {
        ...appointment,
        services: appointment.services.map((s) => s.service),
      },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to fetch appointment" },
      { status: 500 },
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { status, serviceIds, notes, cubicleId } = body;

    const updateData: any = {};

    if (status === AppointmentStatus.COMPLETED) {
      const existing = await prisma.appointment.findUnique({
        where: { id },
        select: { appointmentStartTime: true, status: true },
      });
      if (!existing) {
        return NextResponse.json(
          { success: false, error: "Appointment not found" },
          { status: 404 },
        );
      }
      if (existing.status === AppointmentStatus.COMPLETED) {
        return NextResponse.json(
          { success: false, error: "Appointment is already completed" },
          { status: 400 },
        );
      }
      if (new Date(existing.appointmentStartTime) > new Date()) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Cannot mark an appointment as completed before its scheduled time",
          },
          { status: 400 },
        );
      }
    }

    if (status === undefined || status !== AppointmentStatus.COMPLETED) {
      if (
        serviceIds !== undefined ||
        notes !== undefined ||
        cubicleId !== undefined
      ) {
        const existing = await prisma.appointment.findUnique({
          where: { id },
          select: { status: true },
        });
        if (existing?.status === AppointmentStatus.COMPLETED) {
          return NextResponse.json(
            { success: false, error: "Cannot modify a completed appointment" },
            { status: 400 },
          );
        }
      }
    }

    let uniqueServiceIds: string[] | undefined;
    if (serviceIds !== undefined) {
      if (!Array.isArray(serviceIds) || serviceIds.length === 0) {
        return NextResponse.json(
          { success: false, error: "At least one service is required" },
          { status: 400 },
        );
      }
      uniqueServiceIds = [...new Set(serviceIds as string[])];
      const existingServices = await prisma.service.findMany({
        where: { id: { in: uniqueServiceIds } },
        select: { id: true },
      });
      if (existingServices.length !== uniqueServiceIds.length) {
        return NextResponse.json(
          { success: false, error: "Service not found" },
          { status: 404 },
        );
      }
    }

    if (status !== undefined) updateData.status = status;
    if (notes !== undefined) updateData.notes = notes;

    if (cubicleId !== undefined) {
      if (cubicleId === null || cubicleId === "") {
        updateData.cubicleId = null;
      } else {
        const cubicle = await prisma.cubicle.findUnique({
          where: { id: cubicleId },
        });
        if (!cubicle) {
          return NextResponse.json(
            { success: false, error: "Selected cubicle not found" },
            { status: 404 },
          );
        }
        if (cubicle.status !== "ACTIVE") {
          return NextResponse.json(
            { success: false, error: "Selected cubicle is not available" },
            { status: 400 },
          );
        }
        updateData.cubicleId = cubicleId;
      }
    }

    const appointment = await prisma.$transaction(async (tx) => {
      if (uniqueServiceIds) {
        await tx.appointmentService.deleteMany({
          where: { appointmentId: id },
        });
        await tx.appointmentService.createMany({
          data: uniqueServiceIds.map((serviceId) => ({
            appointmentId: id,
            serviceId,
          })),
        });
      }

      return tx.appointment.update({
        where: { id },
        data: updateData,
        include: {
          patient: { select: { id: true, patientName: true } },
          therapist: {
            select: { id: true, name: true, email: true, phone: true },
          },
          cubicle: {
            select: { id: true, name: true, roomNumber: true, location: true },
          },
          services: { include: { service: true } },
        },
      });
    });

    return NextResponse.json({
      success: true,
      message: "Appointment updated successfully",
      appointment: {
        ...appointment,
        services: appointment.services.map((s) => s.service),
      },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to update appointment" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    await prisma.appointment.update({
      where: { id },
      data: { status: AppointmentStatus.CANCELLED },
    });

    return NextResponse.json({
      success: true,
      message: "Appointment cancelled successfully",
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to cancel appointment" },
      { status: 500 },
    );
  }
}
