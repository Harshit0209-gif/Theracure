import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const status = url.searchParams.get("status")?.toUpperCase() || "ACTIVE";

    const therapists = await prisma.therapist.findMany({
      where: {
        status: status as "ACTIVE" | "INACTIVE",
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            status: true,
          },
        },
      },
      orderBy: {
        user: { name: "asc" },
      },
    });

    const result = therapists.map((t) => ({
      id: t.id,
      name: t.user.name,
      email: t.user.email,
      phone: t.user.phone,
      specialization: t.specialization,
      qualification: t.qualification,
      status: t.status,
    }));

    return NextResponse.json({ success: true, therapists: result });
  } catch (error) {
    console.error("Failed to fetch therapists:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch therapists" },
      { status: 500 }
    );
  }
}
