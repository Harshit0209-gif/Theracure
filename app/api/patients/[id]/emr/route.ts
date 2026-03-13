import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  getSession,
  requireAuth,
  isSessionExpiringSoon,
} from "@/lib/auth/session-provider";
import { z } from "zod";

const EMRQuerySchema = z.object({
  page: z.string().transform(Number).pipe(z.number().min(1)).default("1"),
  limit: z
    .string()
    .transform(Number)
    .pipe(z.number().min(1).max(50))
    .default("10"),
  search: z.string().optional(),
  documentType: z.string().optional(),
  sortBy: z
    .enum(["uploadDate", "fileName", "fileSize", "documentType"])
    .default("uploadDate"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Enhanced authentication with better error handling
    const session = await getSession(req);

    if (!session) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized",
          code: "SESSION_EXPIRED",
          message: "Your session has expired. Please log in again.",
        },
        { status: 401 }
      );
    }

    // Check if session is expiring soon
    if (isSessionExpiringSoon(session)) {
      return NextResponse.json(
        {
          success: false,
          error: "Session expiring soon",
          code: "SESSION_EXPIRING",
          message:
            "Your session will expire soon. Please refresh your session.",
          expiresIn: Math.floor((session.tokenExpiry - Date.now()) / 1000),
        },
        { status: 401 }
      );
    }

    const authSession = requireAuth(session);

    const patientId = await params.then((p) => p.id);
    const { searchParams } = new URL(req.url);
    const queryParams = Object.fromEntries(searchParams.entries());

    // Validate query parameters
    const validatedQuery = EMRQuerySchema.parse(queryParams);

    // Verify patient exists and user has access
    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
    });

    if (!patient) {
      return NextResponse.json(
        { success: false, error: "Patient not found" },
        { status: 404 }
      );
    }

    // Build where clause for EMR records
    const whereClause: any = {
      patientId: patientId,
    };

    // Apply search filter
    if (validatedQuery.search) {
      whereClause.OR = [
        {
          fileName: {
            contains: validatedQuery.search,
            mode: "insensitive",
          },
        },
        {
          description: {
            contains: validatedQuery.search,
            mode: "insensitive",
          },
        },
        {
          category: {
            contains: validatedQuery.search,
            mode: "insensitive",
          },
        },
        {
          tags: {
            hasSome: [validatedQuery.search],
          },
        },
      ];
    }

    // Apply document type filter
    if (validatedQuery.documentType) {
      whereClause.documentType = validatedQuery.documentType;
    }

    // Calculate pagination
    const skip = (validatedQuery.page - 1) * validatedQuery.limit;
    const take = validatedQuery.limit;

    // Fetch records with pagination
    const [records, totalCount] = await Promise.all([
      prisma.medicalRecord.findMany({
        where: whereClause,
        include: {
          uploadedByUser: {
            select: {
              id: true,
              name: true,
              role: true,
            },
          },
        },
        orderBy: {
          [validatedQuery.sortBy]: validatedQuery.sortOrder,
        },
        skip,
        take,
      }),
      prisma.medicalRecord.count({ where: whereClause }),
    ]);

    return NextResponse.json({
      success: true,
      records,
      pagination: {
        currentPage: validatedQuery.page,
        totalPages: Math.ceil(totalCount / validatedQuery.limit),
        totalCount,
        limit: validatedQuery.limit,
      },
    });
  } catch (error) {
    console.error("Patient EMR fetch error:", error);

    // Handle authentication errors
    if (error instanceof Error) {
      if (error.message === "Authentication required") {
        return NextResponse.json(
          {
            success: false,
            error: "Unauthorized",
            code: "AUTH_REQUIRED",
            message: "Authentication required",
          },
          { status: 401 }
        );
      }

      if (error.message === "Token expiring soon") {
        return NextResponse.json(
          {
            success: false,
            error: "Session expiring soon",
            code: "TOKEN_EXPIRING",
            message:
              "Your session will expire soon. Please refresh your session.",
          },
          { status: 401 }
        );
      }
    }

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid query parameters",
          details: error.errors,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
