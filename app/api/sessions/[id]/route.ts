import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/sessions/[id] - Fetch single therapy session
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const session = await prisma.therapySession.findUnique({
      where: { id },
      include: {
        patient: {
          select: {
            id: true,
            patientName: true,
            phone: true,
            email: true,
            address: true,
            age: true,
            gender: true,
          },
        },
        therapist: {
          select: {
            id: true,
            specialization: true,
            qualification: true,
            user: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
        prescriptions: {
          select: {
            id: true,
            medications: true,
            followUpDate: true,
            createdAt: true,
            updatedAt: true,
          },
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });

    if (!session) {
      return NextResponse.json(
        {
          success: false,
          error: "Therapy session not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      session,
    });
  } catch (error) {
    console.error("Error fetching therapy session:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch therapy session",
      },
      { status: 500 }
    );
  }
}

// PUT /api/sessions/[id] - Update therapy session
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { sessionNotes, sessionDate, sessionData, completed } = body;

    // Check if session exists
    const existingSession = await prisma.therapySession.findUnique({
      where: { id },
    });

    if (!existingSession) {
      return NextResponse.json(
        {
          success: false,
          error: "Therapy session not found",
        },
        { status: 404 }
      );
    }

    // Prepare update data
    const updateData: any = {};

    if (sessionNotes !== undefined) {
      updateData.sessionNotes = sessionNotes;
    }

    if (sessionDate !== undefined) {
      updateData.sessionDate = new Date(sessionDate);
    }

    if (sessionData !== undefined) {
      updateData.sessionData = sessionData;
    }

    if (completed !== undefined) {
      updateData.completed = completed;
    }

    // Update session
    const updatedSession = await prisma.therapySession.update({
      where: { id },
      data: updateData,
      include: {
        patient: {
          select: {
            id: true,
            patientName: true,
            phone: true,
            email: true,
          },
        },
        therapist: {
          select: {
            id: true,
            user: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
        prescriptions: {
          select: {
            id: true,
            medications: true,
            createdAt: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      session: updatedSession,
    });
  } catch (error) {
    console.error("Error updating therapy session:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to update therapy session",
      },
      { status: 500 }
    );
  }
}

// DELETE /api/sessions/[id] - Delete therapy session
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check if session exists
    const existingSession = await prisma.therapySession.findUnique({
      where: { id },
      include: {
        prescriptions: true,
      },
    });

    if (!existingSession) {
      return NextResponse.json(
        {
          success: false,
          error: "Therapy session not found",
        },
        { status: 404 }
      );
    }

    // Check if session has prescriptions
    if (existingSession.prescriptions.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Cannot delete session with associated prescriptions. Delete prescriptions first.",
        },
        { status: 400 }
      );
    }

    // Delete session
    await prisma.therapySession.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "Therapy session deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting therapy session:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to delete therapy session",
      },
      { status: 500 }
    );
  }
}

// GET /api/sessions/stats - Get session statistics
export async function getSessionStats(
  req: NextRequest,
  { params }: { params: Promise<{ action: string }> }
) {
  try {
    const { searchParams } = new URL(req.url);
    const therapistId = searchParams.get("therapistId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const where: any = {};

    if (therapistId) {
      where.therapistId = therapistId;
    }

    if (startDate || endDate) {
      where.sessionDate = {};
      if (startDate) {
        where.sessionDate.gte = new Date(startDate);
      }
      if (endDate) {
        where.sessionDate.lte = new Date(endDate);
      }
    }

    const [
      totalSessions,
      completedSessions,
      pendingSessions,
      sessionsThisWeek,
      sessionsThisMonth,
    ] = await Promise.all([
      prisma.therapySession.count({ where }),
      prisma.therapySession.count({
        where: { ...where, completed: true },
      }),
      prisma.therapySession.count({
        where: { ...where, completed: false },
      }),
      prisma.therapySession.count({
        where: {
          ...where,
          sessionDate: {
            gte: new Date(new Date().setDate(new Date().getDate() - 7)),
          },
        },
      }),
      prisma.therapySession.count({
        where: {
          ...where,
          sessionDate: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          },
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      stats: {
        totalSessions,
        completedSessions,
        pendingSessions,
        completionRate:
          totalSessions > 0
            ? ((completedSessions / totalSessions) * 100).toFixed(1)
            : 0,
        sessionsThisWeek,
        sessionsThisMonth,
      },
    });
  } catch (error) {
    console.error("Error fetching session stats:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch session statistics",
      },
      { status: 500 }
    );
  }
}
