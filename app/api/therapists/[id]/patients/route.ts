import { prisma } from "@/lib/prisma";
import { AppointmentStatus } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const therapistId = id;

    const assignments = await prisma.appointment.findMany({
      where: {
        therapistId,
        status: {
          in: [AppointmentStatus.CONFIRMED, AppointmentStatus.COMPLETED],
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
      assignments
        .filter((assignment) => assignment.patient !== null)
        .map(async (assignment) => {
          // We know assignment.patient is not null here due to the filter, 
          // but TypeScript might need a check or assertion if not strictly typed by the filter.
          // However, we can just use optional chaining or non-null assertion if we are sure.
          if (!assignment.patient) return null;

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

          const nextAppointment = await prisma.appointment.findFirst({
            where: {
              patientId: assignment.patientId,
              therapistId: assignment.therapistId,
              appointmentStartTime: {
                gte: new Date(),
              },
              status: {
                in: [AppointmentStatus.CONFIRMED],
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

    // Filter out any nulls that might have returned (though our map ensures valid objects or null)
    // and then do uniqueness check.
    const validPatients = patientsWithSessions.filter((p): p is NonNullable<typeof p> => p !== null);

    const uniquePatients = validPatients.filter(
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
