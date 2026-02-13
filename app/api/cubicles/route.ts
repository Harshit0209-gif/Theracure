import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { CubicleStatus } from "@prisma/client";

// GET /api/cubicles - List all cubicles with pagination and filters
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const search = url.searchParams.get("search") || "";
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "20");
    const status = url.searchParams.get("status") as CubicleStatus | null;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        {
          name: { contains: search, mode: "insensitive" as const },
        },
        {
          roomNumber: { contains: search, mode: "insensitive" as const },
        },
        {
          location: { contains: search, mode: "insensitive" as const },
        },
      ];
    }

    const [cubicles, totalCount] = await Promise.all([
      prisma.cubicle.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          _count: {
            select: {
              appointments: true,
            },
          },
        },
      }),
      prisma.cubicle.count({ where }),
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({
      success: true,
      cubicles,
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
    console.error("Error fetching cubicles:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch cubicles" },
      { status: 500 }
    );
  }
}

// POST /api/cubicles - Create a new cubicle
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, description, roomNumber, location, createdBy, status } = body;

    // Validate required fields
    if (!name || !createdBy) {
      return NextResponse.json(
        {
          success: false,
          error: "Name and createdBy are required fields",
        },
        { status: 400 }
      );
    }

    // Check if cubicle with same name already exists
    const existingCubicle = await prisma.cubicle.findFirst({
      where: {
        name: {
          equals: name,
          mode: "insensitive",
        },
      },
    });

    if (existingCubicle) {
      return NextResponse.json(
        {
          success: false,
          error: "A cubicle with this name already exists",
        },
        { status: 400 }
      );
    }

    const cubicle = await prisma.cubicle.create({
      data: {
        name,
        description,
        roomNumber,
        location,
        createdBy,
        status: status || CubicleStatus.ACTIVE,
      },
    });

    return NextResponse.json({
      success: true,
      cubicle,
      message: "Cubicle created successfully",
    });
  } catch (error) {
    console.error("Error creating cubicle:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to create cubicle",
      },
      { status: 500 }
    );
  }
}
