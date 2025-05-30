import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function GET(
    req: Request,
    { params }: { params: { id: string } }
  ) {
    try {
      const patient = await prisma.patient.findUnique({
        where: { patientId: params.id },
        include: {
          therapist: {
            include: {
              user: {
                select: {
                  name: true
                }
              }
            }
          }
        }
      })
  
      if (!patient) {
        return NextResponse.json({
          success: false,
          error: "Patient not found"
        }, { status: 404 })
      }
  
      return NextResponse.json({
        success: true,
        patient: {
          id: patient.id,
          patientId: patient.patientId,
          name: patient.name,
          email: patient.email,
          phone: patient.phone,
          gender: patient.gender,
          address: patient.address,
          therapistName: patient.therapist?.user?.name || null
        }
      })
    } catch (error) {
      return NextResponse.json({
        success: false,
        error: "Failed to fetch patient"
      }, { status: 500 })
    }
  }