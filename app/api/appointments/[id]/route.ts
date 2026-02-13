import { prisma } from "@/lib/prisma";
import { AppointmentStatus } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const appointment = await prisma.appointment.findUnique({
      where: { id },
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
            name: true,
          },
        },
        cubicle: {
          select: {
            id: true,
            name: true,
            roomNumber: true,
            location: true,
          },
        },
      },
    });

    if (!appointment) {
      return NextResponse.json(
        { success: false, error: "Appointment not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      appointment,
    });
  } catch (error) {
    console.error("Error fetching appointment:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch appointment" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    console.log("PATCH body:", body);
    const { status, serviceId, notes, cubicleId } = body;

    // Build update data object
    const updateData: any = {};

    if (status !== undefined) updateData.status = status;
    if (serviceId !== undefined) updateData.serviceId = serviceId;
    if (notes !== undefined) updateData.notes = notes;

    // Handle cubicleId - can be null to unassign, or a string to assign/update
    if (cubicleId !== undefined) {
      if (cubicleId === null || cubicleId === "") {
        updateData.cubicleId = null;
      } else {
        // Verify cubicle exists and is active
        const cubicle = await prisma.cubicle.findUnique({
          where: { id: cubicleId },
        });

        if (!cubicle) {
          return NextResponse.json(
            { success: false, error: "Selected cubicle not found" },
            { status: 404 }
          );
        }

        if (cubicle.status !== "ACTIVE") {
          return NextResponse.json(
            { success: false, error: "Selected cubicle is not available" },
            { status: 400 }
          );
        }

        updateData.cubicleId = cubicleId;
      }
    }

    const appointment = await prisma.appointment.update({
      where: { id },
      data: updateData,
      include: {
        patient: {
          select: {
            id: true,
            patientName: true,
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
        cubicle: {
          select: {
            id: true,
            name: true,
            roomNumber: true,
            location: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: "Appointment updated successfully",
      appointment,
    });
  } catch (error) {
    console.error("Error updating appointment:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update appointment" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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
  } catch (error) {
    console.error("Error cancelling appointment:", error);
    return NextResponse.json(
      { success: false, error: "Failed to cancel appointment" },
      { status: 500 }
    );
  }
}
