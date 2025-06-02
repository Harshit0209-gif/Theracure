import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateServiceSchema = z.object({
  name: z.string().min(1).optional(),
  price: z.number().positive().optional(),
  category: z.string().min(1).optional(),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid service ID",
        },
        { status: 400 }
      );
    }

    const body = await req.json();

    // Validate request body
    const validationResult = updateServiceSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation failed",
          details: validationResult.error.errors,
        },
        { status: 400 }
      );
    }

    // Check if service exists
    const existingService = await prisma.service.findUnique({
      where: { id },
    });

    if (!existingService) {
      return NextResponse.json(
        {
          success: false,
          error: "Service not found",
        },
        { status: 404 }
      );
    }

    // If name or category is being changed, check for duplicates
    if (validationResult.data.name || validationResult.data.category) {
      const duplicateService = await prisma.service.findFirst({
        where: {
          AND: [
            { id: { not: id } },
            {
              name: validationResult.data.name || existingService.name,
              category:
                validationResult.data.category || existingService.category,
            },
          ],
        },
      });

      if (duplicateService) {
        return NextResponse.json(
          {
            success: false,
            error: "Service with this name already exists in the category",
          },
          { status: 409 }
        );
      }
    }

    // Update service
    const updatedService = await prisma.service.update({
      where: { id },
      data: validationResult.data,
    });

    return NextResponse.json({
      success: true,
      data: updatedService,
      message: "Service updated successfully",
    });
  } catch (error) {
    console.error("Error updating service:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to update service",
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

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid service ID",
        },
        { status: 400 }
      );
    }

    const body = await req.json();

    // For PUT, all fields except isActive are required
    const putSchema = z.object({
      name: z.string().min(1, "Service name is required"),
      price: z.number().positive("Price must be positive"),
      category: z.string().min(1, "Category is required"),
      description: z.string().optional(),
      isActive: z.boolean().optional(),
    });

    const validationResult = putSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation failed",
          details: validationResult.error.errors,
        },
        { status: 400 }
      );
    }

    const existingService = await prisma.service.findUnique({
      where: { id },
    });

    if (!existingService) {
      return NextResponse.json(
        {
          success: false,
          error: "Service not found",
        },
        { status: 404 }
      );
    }

    // Check for duplicate name in category
    const duplicateService = await prisma.service.findFirst({
      where: {
        AND: [
          { id: { not: id } },
          {
            name: validationResult.data.name,
            category: validationResult.data.category,
          },
        ],
      },
    });

    if (duplicateService) {
      return NextResponse.json(
        {
          success: false,
          error: "Service with this name already exists in the category",
        },
        { status: 409 }
      );
    }

    // Replace entire service
    const updatedService = await prisma.service.update({
      where: { id },
      data: {
        name: validationResult.data.name,
        price: validationResult.data.price,
        category: validationResult.data.category,
        description: validationResult.data.description || "",
        isActive: validationResult.data.isActive ?? true,
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedService,
      message: "Service replaced successfully",
    });
  } catch (error) {
    console.error("Error replacing service:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to replace service",
      },
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

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid service ID",
        },
        { status: 400 }
      );
    }

    // Check if service exists
    const existingService = await prisma.service.findUnique({
      where: { id },
    });

    if (!existingService) {
      return NextResponse.json(
        {
          success: false,
          error: "Service not found",
        },
        { status: 404 }
      );
    }

    // Delete the service
    await prisma.service.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "Service deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting service:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to delete service",
      },
      { status: 500 }
    );
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid service ID",
        },
        { status: 400 }
      );
    }

    const service = await prisma.service.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            invoiceItems: true,
          },
        },
      },
    });

    if (!service) {
      return NextResponse.json(
        {
          success: false,
          error: "Service not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: service,
    });
  } catch (error) {
    console.error("Error fetching service:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch service",
      },
      { status: 500 }
    );
  }
}
