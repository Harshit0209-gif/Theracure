import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { updateUserSchema } from "@/lib/validations/user";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id || typeof id !== "string") {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid user ID provided",
        },
        { status: 400 }
      );
    }

    // Fetch user from database
    const user = await prisma.user.findUnique({
      where: {
        id: id,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Check if user exists
    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: "User not found",
        },
        { status: 404 }
      );
    }

    // Return user data
    return NextResponse.json(
      {
        success: true,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          phone: user.phone,
          status: user.status,
          createdAt: user.createdAt.toISOString(),
          updatedAt: user.updatedAt.toISOString(),
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching user:", error);

    // Handle Prisma errors
    if (error instanceof Error && error.message.includes("Invalid")) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid user ID format",
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const body = await req.json();
    const { id } = await params;

    console.log("Request body for updating user:", body);

    const result = updateUserSchema.safeParse(body);
    console.log("Validation result:", result);
    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid input", details: result.error.format() },
        { status: 400 }
      );
    }

    const { ...updateData } = result.data;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Hash password if provided
    if (updateData.password) {
      updateData.password = await bcrypt.hash(updateData.password, 10);
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ success: true, updatedUser }, { status: 200 });
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json(
      { error: "Failed to update user" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Validate ID format
    if (!id || typeof id !== "string") {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid user ID provided",
        },
        { status: 400 }
      );
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      return NextResponse.json(
        {
          success: false,
          error: "User not found",
        },
        { status: 404 }
      );
    }

    // Instead of hard delete, you might want to soft delete by updating status
    const deletedUser = await prisma.user.update({
      where: { id },
      data: {
        status: "inactive",
        updatedAt: new Date(),
      },
      select: {
        id: true,
        name: true,
        email: true,
        status: true,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "User deactivated successfully",
        user: deletedUser,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting user:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
