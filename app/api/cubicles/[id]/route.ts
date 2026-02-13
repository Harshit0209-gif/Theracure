import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { CubicleStatus } from "@prisma/client";

// GET /api/cubicles/[id] - Get cubicle by ID
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const cubicle = await prisma.cubicle.findUnique({
      where: { id: params.id },
      include: {
        appointments: {
          where: {
            appointmentStartTime: {
              gte: new Date(),
            },
          },
          take: 10,
          orderBy: {
            appointmentStartTime: "asc",
          },
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
              },
            },
          },
        },
        _count: {
          select: {
            appointments: true,
          },
        },
      },
    });

    if (!cubicle) {
      return NextResponse.json(
        { success: false, error: "Cubicle not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      cubicle,
    });
  } catch (error) {
    console.error("Error fetching cubicle:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch cubicle" },
      { status: 500 }
    );
  }
}

// PATCH /api/cubicles/[id] - Update cubicle
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const { name, description, roomNumber, location, status } = body;

    // Check if cubicle exists
    const existingCubicle = await prisma.cubicle.findUnique({
      where: { id: params.id },
    });

    if (!existingCubicle) {
      return NextResponse.json(
        { success: false, error: "Cubicle not found" },
        { status: 404 }
      );
    }

    // If name is being updated, check for duplicates
    if (name && name !== existingCubicle.name) {
      const duplicateCubicle = await prisma.cubicle.findFirst({
        where: {
          name: {
            equals: name,
            mode: "insensitive",
          },
          id: {
            not: params.id,
          },
        },
      });

      if (duplicateCubicle) {
        return NextResponse.json(
          {
            success: false,
            error: "A cubicle with this name already exists",
          },
          { status: 400 }
        );
      }
    }

    const updatedCubicle = await prisma.cubicle.update({
      where: { id: params.id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(roomNumber !== undefined && { roomNumber }),
        ...(location !== undefined && { location }),
        ...(status && { status }),
      },
    });

    return NextResponse.json({
      success: true,
      cubicle: updatedCubicle,
      message: "Cubicle updated successfully",
    });
  } catch (error) {
    console.error("Error updating cubicle:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update cubicle" },
      { status: 500 }
    );
  }
}

// DELETE /api/cubicles/[id] - Delete/deactivate cubicle
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check if cubicle exists
    const existingCubicle = await prisma.cubicle.findUnique({
      where: { id: params.id },
    });

    if (!existingCubicle) {
      return NextResponse.json(
        { success: false, error: "Cubicle not found" },
        { status: 404 }
      );
    }

    // Check if cubicle has any future appointments
    const futureAppointments = await prisma.appointment.count({
      where: {
        cubicleId: params.id,
        appointmentStartTime: {
          gte: new Date(),
        },
        status: "CONFIRMED",
      },
    });

    if (futureAppointments > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Cannot delete cubicle with ${futureAppointments} upcoming appointments. Please deactivate it instead.`,
        },
        { status: 400 }
      );
    }

    // Soft delete by setting status to INACTIVE
    const deactivatedCubicle = await prisma.cubicle.update({
      where: { id: params.id },
      data: {
        status: CubicleStatus.INACTIVE,
      },
    });

    return NextResponse.json({
      success: true,
      cubicle: deactivatedCubicle,
      message: "Cubicle deactivated successfully",
    });
  } catch (error) {
    console.error("Error deleting cubicle:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete cubicle" },
      { status: 500 }
    );
  }
}
