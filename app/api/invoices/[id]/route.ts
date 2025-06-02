import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// Validation schema for invoice updates
const updateInvoiceSchema = z.object({
  patientName: z.string().min(1).optional(),
  date: z.string().datetime().optional(),
  totalAmount: z.number().min(0).optional(),
  amountPaid: z.number().min(0).optional(),
  status: z.enum(["DUE", "PAID", "PARTIALLY_PAID", "CANCELLED"]).optional(),
  paymentMethod: z.string().optional(),
  notes: z.string().optional(),
});

// GET /api/invoices/[id] - Get single invoice
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        patient: {
          select: {
            id: true,
            patientName: true,
            email: true,
            phone: true,
            address: true,
            age: true,
            gender: true,
          },
        },
      },
    });

    if (!invoice) {
      return NextResponse.json(
        {
          success: false,
          error: "Invoice not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: invoice,
    });
  } catch (error) {
    console.error("Error fetching invoice:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch invoice",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();

    // Validate request body
    const validatedData = updateInvoiceSchema.parse(body);

    // Check if invoice exists
    const existingInvoice = await prisma.invoice.findUnique({
      where: { id },
    });

    if (!existingInvoice) {
      return NextResponse.json(
        {
          success: false,
          error: "Invoice not found",
        },
        { status: 404 }
      );
    }

    // Prepare update data
    const updateData: any = { ...validatedData };

    // Convert date string to Date object if provided
    if (validatedData.date) {
      updateData.date = new Date(validatedData.date);
    }

    // Auto-update status based on payment if amounts are provided
    if (
      validatedData.totalAmount !== undefined ||
      validatedData.amountPaid !== undefined
    ) {
      const totalAmount =
        validatedData.totalAmount || existingInvoice.totalAmount;
      const amountPaid =
        validatedData.amountPaid !== undefined
          ? validatedData.amountPaid
          : existingInvoice.amountPaid;

      if (amountPaid === 0) {
        updateData.status = "DUE";
      } else if (amountPaid >= totalAmount) {
        updateData.status = "PAID";
      } else {
        updateData.status = "PARTIALLY_PAID";
      }
    }

    // Update invoice
    const updatedInvoice = await prisma.invoice.update({
      where: { id },
      data: updateData,
      include: {
        patient: {
          select: {
            id: true,
            patientName: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedInvoice,
      message: "Invoice updated successfully",
    });
  } catch (error) {
    console.error("Error updating invoice:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation failed",
          details: error.errors,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: "Failed to update invoice",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Check if invoice exists
    const existingInvoice = await prisma.invoice.findUnique({
      where: { id },
    });

    if (!existingInvoice) {
      return NextResponse.json(
        {
          success: false,
          error: "Invoice not found",
        },
        { status: 404 }
      );
    }

    // Soft delete or hard delete based on your preference
    // For hard delete:
    await prisma.invoice.delete({
      where: { id },
    });

    // For soft delete (if you have a deletedAt field):
    // await prisma.invoice.update({
    //   where: { id },
    //   data: { deletedAt: new Date() }
    // })

    return NextResponse.json({
      success: true,
      message: "Invoice deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting invoice:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to delete invoice",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
