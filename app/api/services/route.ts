import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { serviceSchema } from "@/lib/validations/service";

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const category = searchParams.get("category");
    const search = searchParams.get("search");
    const includeInactive = searchParams.get("includeInactive") === "true";

    const where: any = {};

    if (!includeInactive) where.isActive = true;
    if (category) where.category = category;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    const totalCount = await prisma.service.count({ where });
    const services = await prisma.service.findMany({
      where,
      orderBy: [{ category: "asc" }, { name: "asc" }],
    });

    return NextResponse.json({ success: true, data: services, totalCount });
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to fetch services" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const validationResult = serviceSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation failed",
          details: validationResult.error.issues,
        },
        { status: 400 },
      );
    }

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
        { status: 409 },
      );
    }

    const service = await prisma.service.create({
      data: {
        name: validationResult.data.name,
        price: validationResult.data.price,
        category: validationResult.data.category,
        description: validationResult.data.description || "",
        isActive: validationResult.data.isActive ?? true,
      },
    });

    return NextResponse.json(
      { success: true, data: service, message: "Service created successfully" },
      { status: 201 },
    );
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to create service" },
      { status: 500 },
    );
  }
}
