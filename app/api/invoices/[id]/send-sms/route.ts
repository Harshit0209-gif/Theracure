import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { storageService } from "@/lib/services/storage-factory";
import { sendSMSNotification } from "@/config/smsConfig";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        patient: {
          select: { id: true, patientName: true, phone: true },
        },
      },
    });

    if (!invoice) {
      return NextResponse.json({ success: false, error: "Invoice not found" }, { status: 404 });
    }

    if (!invoice.patient?.phone) {
      return NextResponse.json({ success: false, error: "Patient has no phone number" }, { status: 400 });
    }

    // Always generate a fresh presigned URL — pdfUrl stores the file path, not a URL
    const filePath = invoice.pdfUrl || `invoices/${id}.pdf`;
    let downloadUrl: string;
    try {
      downloadUrl = await storageService.generatePresignedUrl(
        filePath,
        7 * 24 * 60 * 60,
      );
      // Store path (not URL) if not already set
      if (!invoice.pdfUrl) {
        await prisma.invoice.update({ where: { id }, data: { pdfUrl: filePath } });
      }
    } catch {
      return NextResponse.json(
        { success: false, error: "Invoice PDF not found. Please regenerate the invoice." },
        { status: 404 },
      );
    }

    await sendSMSNotification("INVOICE_NOTIFICATION", {
      phone: invoice.patient.phone,
      patientName: invoice.patient.patientName,
      therapistName: "",
      amount: invoice.totalAmount,
      link: downloadUrl,
    });

    return NextResponse.json({ success: true, message: "SMS sent successfully" });
  } catch (error) {
    console.error("Error sending invoice SMS:", error);
    return NextResponse.json({ success: false, error: "Failed to send SMS" }, { status: 500 });
  }
}
