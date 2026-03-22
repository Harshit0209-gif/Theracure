import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth/session-provider";

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession(request);
    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    await prisma.holiday.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true, message: "Holiday deleted" });
  } catch (error) {
    console.error("Holiday DELETE error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete holiday" },
      { status: 500 }
    );
  }
}
