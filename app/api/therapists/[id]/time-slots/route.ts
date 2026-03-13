import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const therapistId = id
    
    const timeSlots = await prisma.therapistTimeSlot.findMany({
      where: { therapistId },
      orderBy: [
        { weekDay: 'asc' },
        { startTime: 'asc' }
      ]
    })

    return NextResponse.json({
      success: true,
      timeSlots
    })
  } catch (error) {
    console.error('Error fetching time slots:', error)
    return NextResponse.json({
      success: false,
      error: "Failed to fetch time slots"
    }, { status: 500 })
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const therapistId = id

    // First verify that the therapist exists
    const therapist = await prisma.therapist.findUnique({
      where: { id: therapistId }
    })

    if (!therapist) {
      return NextResponse.json({
        success: false,
        error: "Therapist not found"
      }, { status: 404 })
    }

    const body = await req.json()
    const { weekDay, startTime, endTime, isRecurring } = body

    // Validate inputs
    if (weekDay === undefined || !startTime || !endTime) {
      return NextResponse.json({
        success: false,
        error: "Weekday, start time, and end time are required"
      }, { status: 400 })
    }

    // Validate weekday (0-6)
    if (weekDay < 0 || weekDay > 6) {
      return NextResponse.json({
        success: false,
        error: "Weekday must be between 0 (Sunday) and 6 (Saturday)"
      }, { status: 400 })
    }

    // Validate time format (HH:mm)
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
    if (!timeRegex.test(startTime) || !timeRegex.test(endTime)) {
      return NextResponse.json({
        success: false,
        error: "Time must be in HH:mm format (e.g., 09:00, 14:30)"
      }, { status: 400 })
    }

    // Validate that end time is after start time
    if (endTime <= startTime) {
      return NextResponse.json({
        success: false,
        error: "End time must be after start time"
      }, { status: 400 })
    }

    // Check for overlapping slots
    const existingSlot = await prisma.therapistTimeSlot.findFirst({
      where: {
        therapistId,
        weekDay,
        OR: [
          {
            AND: [
              { startTime: { lte: startTime } },
              { endTime: { gt: startTime } }
            ]
          },
          {
            AND: [
              { startTime: { lt: endTime } },
              { endTime: { gte: endTime } }
            ]
          }
        ]
      }
    })

    if (existingSlot) {
      return NextResponse.json({
        success: false,
        error: "Time slot overlaps with an existing slot"
      }, { status: 400 })
    }

    const timeSlot = await prisma.therapistTimeSlot.create({
      data: {
        therapistId,
        weekDay,
        startTime,
        endTime,
        isRecurring: isRecurring ?? true,
        isAvailable: true
      }
    })

    return NextResponse.json({
      success: true,
      timeSlot
    })
  } catch (error) {
    console.error('Error creating time slot:', error)
    return NextResponse.json({
      success: false,
      error: "Failed to create time slot"
    }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const therapistId = id
    const { searchParams } = new URL(req.url)
    const slotId = searchParams.get('slotId')

    if (!slotId) {
      return NextResponse.json({
        success: false,
        error: "Slot ID is required"
      }, { status: 400 })
    }

    // Verify the time slot belongs to the therapist
    const timeSlot = await prisma.therapistTimeSlot.findFirst({
      where: {
        id: slotId,
        therapistId
      }
    })

    if (!timeSlot) {
      return NextResponse.json({
        success: false,
        error: "Time slot not found or does not belong to this therapist"
      }, { status: 404 })
    }

    await prisma.therapistTimeSlot.delete({
      where: { id: slotId }
    })

    return NextResponse.json({
      success: true,
      message: "Time slot deleted successfully"
    })
  } catch (error) {
    console.error('Error deleting time slot:', error)
    return NextResponse.json({
      success: false,
      error: "Failed to delete time slot"
    }, { status: 500 })
  }
} 