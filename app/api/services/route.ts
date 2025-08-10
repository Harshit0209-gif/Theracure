import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { serviceSchema } from "@/lib/validations/service";

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const category = searchParams.get("category");
    const isActive = searchParams.get("isActive");
    const search = searchParams.get("search");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    const where: any = {};

    if (category) {
      where.category = category;
    }

    if (isActive !== null) {
      where.isActive = isActive === "true";
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    const totalCount = await prisma.service.count({ where });

    const services = await prisma.service.findMany({
      where,
      skip,
      take: limit,
      orderBy: [{ category: "asc" }, { name: "asc" }],
    });

    return NextResponse.json({
      success: true,
      data: services,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching services:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch services",
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    console.log("services post body", body);

    const validationResult = serviceSchema.safeParse(body);

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

    // Check if service with same name exists in the category
    const existingService = await prisma.service.findFirst({
      where: {
        name: validationResult.data.name,
        category: validationResult.data.category,
      },
    });

    if (existingService) {
      return NextResponse.json(
        {
          success: false,
          error: "Service with this name already exists in the category",
        },
        { status: 409 }
      );
    }

    // Create new service
    const service = await prisma.service.create({
      data: {
        name: validationResult.data.name,
        price: validationResult.data.price,
        category: validationResult.data.category,
        description: validationResult.data.description || "",
        isActive: validationResult.data.isActive ?? true,
      },
    });
    console.log("Service created:", service);

    return NextResponse.json(
      {
        success: true,
        data: service,
        message: "Service created successfully",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating service:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to create service",
      },
      { status: 500 }
    );
  }
}
