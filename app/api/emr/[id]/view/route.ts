import { NextRequest, NextResponse } from "next/server";
import { emrService } from "@/lib/services/emr-service";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const url = await emrService.generateViewUrl(id);

    return NextResponse.json({ url });
  } catch (error) {
    console.error("View error:", error);
    return NextResponse.json(
      { error: "Failed to get file URL" },
      { status: 500 }
    );
  }
}
