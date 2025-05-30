import { prisma } from "@/lib/prisma"
import { safeValidate, validationErrorResponse } from "@/lib/utils/validation"
import { conflictCheckSchema, createAppointmentSchema } from "@/lib/validations/appointment"
import { NextRequest, NextResponse } from "next/server"
import { Prisma } from "@prisma/client"
import { getDay } from "date-fns"

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const search = url.searchParams.get("search") || ""
    const page = parseInt(url.searchParams.get("page") || "1")
    const limit = parseInt(url.searchParams.get("limit") || "10")
    const skip = (page - 1) * limit

    const where = search
      ? {
          OR: [
            { patient: { patientName: { contains: search, mode: "insensitive" as const } } },
            { therapyType: { contains: search, mode: "insensitive" as const } },
            { patient: { id: { contains: search, mode: "insensitive" as const } } },
          ],
        }
      : {}

    const [appointments, total] = await Promise.all([
      prisma.therapistAssignment.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          patient: {
            select: {
              id: true,
              patientName: true,
              phone: true,
              email: true
            }
          },
          therapist: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true
            }
          },
          createdBy: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      }),
      prisma.therapistAssignment.count({ where })
    ])

    return NextResponse.json({
      success: true,
      appointments,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        page,
        limit
      }
    })
  } catch (error) {
    console.error("Error fetching appointments:", error)
    return NextResponse.json(
      { success: false, error: "Failed to fetch appointments" },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    console.log("Appointment request body:", body)
    const {
      patientId,
      therapistId,
      appointmentStartTime,
      appointmentEndTime,
      therapyType,
      notes,
      createdById
    } = body

    // Validate required fields
    if (!patientId || !therapistId || !appointmentStartTime || !appointmentEndTime || !therapyType || !createdById) {
      console.log("Missing fields:", {
        patientId: !patientId,
        therapistId: !therapistId,
        appointmentStartTime: !appointmentStartTime,
        appointmentEndTime: !appointmentEndTime,
        therapyType: !therapyType,
        createdById: !createdById
      })
      return NextResponse.json({
        success: false,
        error: "Missing required fields"
      }, { status: 400 })
    }

    // Convert string dates to Date objects
    const startTime = new Date(appointmentStartTime)
    const endTime = new Date(appointmentEndTime)

    // Format times to HH:mm string format for comparison
    const startTimeStr = startTime.toTimeString().slice(0, 5)
    const endTimeStr = endTime.toTimeString().slice(0, 5)

    console.log("Formatted times:", {
      startTimeStr,
      endTimeStr,
      weekDay: getDay(startTime)
    })

    // Validate date order
    if (startTime >= endTime) {
      console.log("Invalid date order:", {
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString()
      })
      return NextResponse.json({
        success: false,
        error: "End time must be after start time"
      }, { status: 400 })
    }

    // Get the weekday (0-6) from the appointment date
    const weekDay = getDay(startTime)

    // 1. Check if therapist exists and has a profile
    const therapist = await prisma.therapist.findUnique({
      where: { id: therapistId }
    })

    if (!therapist) {
      console.log("Therapist not found:", therapistId)
      return NextResponse.json({
        success: false,
        error: "Therapist not found"
      }, { status: 404 })
    }

    // 2. Check if therapist has availability for this weekday
    const therapistAvailability = await prisma.therapistTimeSlot.findFirst({
      where: {
        therapistId,
        weekDay,
        isAvailable: true,
        startTime: { lte: startTimeStr },
        endTime: { gte: endTimeStr }
      }
    })

    console.log("Therapist availability check:", {
      therapistId,
      weekDay,
      startTimeStr,
      endTimeStr,
      found: !!therapistAvailability
    })

    if (!therapistAvailability) {
      return NextResponse.json({
        success: false,
        error: "Therapist is not available during this time slot"
      }, { status: 400 })
    }

    // 3. Check for existing appointments that overlap with the requested time
    const existingAppointments = await prisma.therapistAssignment.findMany({
      where: {
        therapistId,
        status: { in: ['confirmed'] },
        OR: [
          {
            AND: [
              { appointmentStartTime: { lte: startTime } },
              { appointmentEndTime: { gt: startTime } }
            ]
          },
          {
            AND: [
              { appointmentStartTime: { lt: endTime } },
              { appointmentEndTime: { gte: endTime } }
            ]
          }
        ]
      }
    })

    console.log("Existing appointments check:", {
      found: existingAppointments.length,
      appointments: existingAppointments
    })

    if (existingAppointments.length > 0) {
      return NextResponse.json({
        success: false,
        error: "Therapist already has an appointment during this time"
      }, { status: 400 })
    }

    // 4. Create the appointment
    const appointment = await prisma.therapistAssignment.create({
      data: {
        patientId,
        therapistId,
        appointmentStartTime: startTime,
        appointmentEndTime: endTime,
        therapyType,
        notes,
        status: 'confirmed',
        createdById,
        assignedDate: new Date()
      }
    })

    console.log("Appointment created successfully:", appointment)

    return NextResponse.json({
      success: true,
      appointment
    })
  } catch (error) {
    console.error('Error creating appointment:', error)
    return NextResponse.json({
      success: false,
      error: "Failed to create appointment"
    }, { status: 500 })
  }
}