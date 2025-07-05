import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const therapistId = id;

    const therapist = await prisma.therapist.findUnique({
      where: { id: therapistId },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    if (!therapist) {
      return NextResponse.json(
        {
          success: false,
          error: "Therapist not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      therapist,
    });
  } catch (error) {
    console.error("Error fetching therapist:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch therapist",
      },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const therapistId = id;
    const body = await req.json();
    const { specialization, qualification } = body;

    // First check if the user exists and is a therapist
    const user = await prisma.user.findUnique({
      where: { id: therapistId },
    });

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: "User not found",
        },
        { status: 404 }
      );
    }

    if (user.role !== UserRole.THERAPIST) {
      return NextResponse.json(
        {
          success: false,
          error: "User is not a therapist",
        },
        { status: 403 }
      );
    }

    // Check if therapist record exists
    const existingTherapist = await prisma.therapist.findUnique({
      where: { id: therapistId },
    });

    let therapist;
    if (existingTherapist) {
      // Update existing therapist
      therapist = await prisma.therapist.update({
        where: { id: therapistId },
        data: {
          specialization,
          qualification,
        },
      });
    } else {
      // Create new therapist record
      therapist = await prisma.therapist.create({
        data: {
          id: therapistId, // This will link to the existing user
          specialization,
          qualification,
        },
      });
    }

    return NextResponse.json({
      success: true,
      therapist,
    });
  } catch (error) {
    console.error("Error updating therapist:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to update therapist",
      },
      { status: 500 }
    );
  }
}
