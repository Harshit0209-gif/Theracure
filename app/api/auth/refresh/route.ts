import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, isSessionExpiringSoon } from "@/lib/auth/session-provider";
import { signToken } from "@/lib/auth/jwt";

export async function POST(req: NextRequest) {
  try {
    const session = await getSession(req);

    if (!session) {
      return NextResponse.json(
        {
          success: false,
          error: "No valid session found",
          code: "NO_SESSION",
        },
        { status: 401 },
      );
    }

    if (!isSessionExpiringSoon(session)) {
      return NextResponse.json(
        {
          success: false,
          error: "Session not expiring soon",
          code: "SESSION_VALID",
        },
        { status: 400 },
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, email: true, role: true, name: true },
    });

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: "User not found",
          code: "USER_NOT_FOUND",
        },
        { status: 401 },
      );
    }

    const newToken = signToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });
    const response = NextResponse.json({
      success: true,
      message: "Token refreshed successfully",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });

    response.cookies.set("token", newToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 7200,
    });

    return response;
  } catch (error) {
    console.error("Token refresh error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to refresh token",
        code: "REFRESH_FAILED",
      },
      { status: 500 },
    );
  }
}
