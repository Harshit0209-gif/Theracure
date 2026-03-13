import { NextRequest, NextResponse } from "next/server";
import { emrService } from "@/lib/services/emr-service";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const signedUrl = await emrService.generateViewUrl(id);

    return NextResponse.json({
      success: true,
      url: signedUrl,
    });
  } catch (error) {
    console.error("Download URL generation failed:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to generate URL",
      },
      { status: 500 }
    );
  }
}
