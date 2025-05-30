import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"


export async function PATCH(
    req: NextRequest,
    { params }:{params: Promise<{id: string}>} 
  ) {
    try {
      const {id} = await params
      const body = await req.json()
      console.log("cancel api body: ", id, body)
      const {reason} = body
  
      const appointment = await prisma.therapistAssignment.update({
        where: { id },
        data: {
            notes: reason,
            status: "cancelled"
        },
          
    })
  
      return NextResponse.json({
        success: true,
        message: "Appointment cancel successfully",
      })
    } catch (error) {
      console.error("Error cancel appointment:", error)
      return NextResponse.json(
        { success: false, error: "Failed to cancel appointment" },
        { status: 500 }
      )
    }
  }