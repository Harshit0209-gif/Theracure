import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const therapistId = id;

    console.log("Fetching assigned patients for therapist:", therapistId);

    const assignments = await prisma.therapistAssignment.findMany({
      where: {
        therapistId,
        status: {
          in: ["confirmed", "completed"],
        },
      },
      include: {
        patient: {
          select: {
            id: true,
            patientName: true,
            age: true,
            gender: true,
            medicalHistory: true,
          },
        },
      },
      orderBy: {
        appointmentStartTime: "desc",
      },
    });

    const patientsWithSessions = await Promise.all(
      assignments.map(async (assignment) => {
        const lastSession = await prisma.therapySession.findFirst({
          where: {
            patientId: assignment.patientId,
            therapistId: assignment.therapistId,
            completed: true,
          },
          orderBy: {
            sessionDate: "desc",
          },
        });

        const nextAppointment = await prisma.therapistAssignment.findFirst({
          where: {
            patientId: assignment.patientId,
            therapistId: assignment.therapistId,
            appointmentStartTime: {
              gte: new Date(),
            },
            status: {
              in: ["confirmed"],
            },
          },
          orderBy: {
            appointmentStartTime: "asc",
          },
        });

        return {
          id: assignment.patient.id,
          patientId: assignment.patientId,
          patientName: assignment.patient.patientName,
          age: assignment.patient.age,
          gender: assignment.patient.gender,
          condition: assignment.patient.medicalHistory || "General therapy",
          lastVisit: lastSession?.sessionDate.toISOString() || null,
          nextAppointment:
            nextAppointment?.appointmentStartTime.toISOString() || null,
          status: assignment.status,
          assignmentId: assignment.id,
        };
      })
    );

    const uniquePatients = patientsWithSessions.filter(
      (patient, index, self) =>
        index === self.findIndex((p) => p.patientId === patient.patientId)
    );

    return NextResponse.json({
      success: true,
      data: uniquePatients,
    });
  } catch (error) {
    console.error("Error fetching assigned patients:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch assigned patients" },
      { status: 500 }
    );
  }
}
