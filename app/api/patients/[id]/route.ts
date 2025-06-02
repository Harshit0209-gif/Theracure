import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    console.log("paramm--", id);
    const patient = await prisma.patient.findUnique({
      where: { id },
    });

    console.log("patient found in db", patient);

    if (!patient) {
      return NextResponse.json(
        {
          success: false,
          error: "Patient not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      patient: {
        id: patient.id,
        name: patient.patientName,
        age: patient.age,
        gender: patient.gender,
        height: patient.height,
        weight: patient.weight,
        phone: patient.phone,
        email: patient.email,
        address: patient.address,
        createdBy: patient.createdById,
        medicalHistory: patient.medicalHistory,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch patient",
      },
      { status: 500 }
    );
  }
}
