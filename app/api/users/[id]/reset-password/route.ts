import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { passwordSchema } from "@/lib/validations/user";
import { getSession } from "@/lib/auth/session-provider";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getSession(req);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Only ADMIN or the user themselves can reset the password
    const isAdmin = session.user.role === "ADMIN";
    const isSelf = session.user.id === id;

    if (!isAdmin && !isSelf) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const { newPassword } = await req.json();

    const parseResult = passwordSchema.safeParse(newPassword);
    if (!parseResult.success) {
      return NextResponse.json(
        { message: parseResult.error.issues[0].message },
        { status: 400 },
      );
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id },
      data: { passwordHash: hashedPassword },
    });

    return NextResponse.json(
      { message: "Password reset successful" },
      { status: 200 },
    );
  } catch {
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 },
    );
  }
}
