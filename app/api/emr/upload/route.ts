import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session-provider";
import { emrService } from "@/lib/services/emr-service";
import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const session = await getSession(req);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    // Parse form data
    const formData = await req.formData();
    const files = formData.getAll("files") as File[];
    const dataString = formData.get("data") as string;

    if (!dataString) {
      return NextResponse.json(
        { success: false, error: "Request data is required" },
        { status: 400 },
      );
    }

    // Validate request data
    let validatedData;
    try {
      const requestData = JSON.parse(dataString);
      validatedData = emrService.validateUploadRequest(requestData);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          {
            success: false,
            error: "Invalid request data",
            details: error.issues,
          },
          { status: 400 },
        );
      }
      return NextResponse.json(
        { success: false, error: "Invalid JSON data" },
        { status: 400 },
      );
    }

    // Validate files
    const fileValidationErrors = emrService.validateFiles(files);
    if (fileValidationErrors.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: "File validation failed",
          details: fileValidationErrors,
        },
        { status: 400 },
      );
    }

    // Convert files to upload format
    const fileUploads = await Promise.all(
      files.map(async (file) => ({
        buffer: Buffer.from(await file.arrayBuffer()),
        originalName: file.name,
        mimeType: file.type,
        size: file.size,
      })),
    );

    // Upload files using EMR service
    const uploadedRecords = await emrService.uploadFiles(fileUploads, {
      patientId: validatedData.patientId,
      documentType: validatedData.documentType,
      category: validatedData.category,
      description: validatedData.description,
      tags: validatedData.tags,
      uploadedBy: session.user.id,
    });

    // Check results
    const successfulUploads = uploadedRecords.filter(
      (record) => record.success,
    );
    const failedUploads = uploadedRecords.filter((record) => !record.success);

    if (successfulUploads.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "All file uploads failed",
          failures: failedUploads,
        },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      message: `${successfulUploads.length} file(s) uploaded successfully`,
      uploadedRecords: successfulUploads,
      failures: failedUploads.length > 0 ? failedUploads : undefined,
    });
  } catch (error) {
    console.error("EMR upload error:", error);

    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
