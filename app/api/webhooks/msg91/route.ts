import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { SmsStatus } from "@/lib/generated/smsEnums";

const FAILED_CODES = new Set(["2", "9", "16", "17", "20", "25"]);

interface NormalizedReport {
  requestId: string;
  statusCode: string;
  description: string;
}

function parsePayload(raw: string): unknown {
  try {
    return JSON.parse(raw);
  } catch {
    try {
      const data = new URLSearchParams(raw).get("data");
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }
}

function normalizeReports(payload: unknown): NormalizedReport[] {
  if (!payload) return [];
  const root = payload as Record<string, unknown>;
  const entries: unknown[] = Array.isArray(payload)
    ? payload
    : Array.isArray(root.data)
      ? (root.data as unknown[])
      : [root.data ?? payload];

  const reports: NormalizedReport[] = [];
  for (const entry of entries) {
    if (!entry || typeof entry !== "object") continue;
    const e = entry as Record<string, unknown>;
    const requestId = String(e.requestId ?? e.request_id ?? "");
    if (!requestId) continue;

    const rawReports = Array.isArray(e.report)
      ? e.report
      : e.report
        ? [e.report]
        : [e];
    for (const r of rawReports) {
      if (!r || typeof r !== "object") continue;
      const rec = r as Record<string, unknown>;

      const clean = (v: unknown) =>
        String(v ?? "")
          .replace(/\{\{[^}]*\}\}/g, "")
          .trim();
      reports.push({
        requestId,
        statusCode: clean(rec.status ?? rec.statusCode),
        description: clean(
          rec.desc ?? rec.description ?? rec.failureReason ?? "",
        ),
      });
    }
  }
  return reports;
}

export async function POST(request: NextRequest) {
  const expectedToken = process.env.MSG91_WEBHOOK_TOKEN;
  if (
    expectedToken &&
    request.nextUrl.searchParams.get("token") !== expectedToken
  ) {
    return NextResponse.json({ success: false }, { status: 401 });
  }

  const raw = await request.text();
  console.log("[MSG91 webhook] payload:", raw.slice(0, 2000));

  const reports = normalizeReports(parsePayload(raw));

  for (const report of reports) {
    const delivered =
      report.statusCode === "1" ||
      /deliver/i.test(`${report.statusCode} ${report.description}`);
    const failed =
      !delivered &&
      (FAILED_CODES.has(report.statusCode) ||
        /fail|reject|block|ndnc|expir/i.test(
          `${report.statusCode} ${report.description}`,
        ));

    try {
      await prisma.smsQueue.updateMany({
        where: { requestId: report.requestId },
        data: {
          // Unknown/interim codes only record the description and keep SENT
          ...(delivered
            ? { status: SmsStatus.DELIVERED, deliveredAt: new Date() }
            : failed
              ? { status: SmsStatus.FAILED }
              : {}),
          deliveryDesc: report.description || report.statusCode,
        },
      });
    } catch (error) {
      console.error(
        `[MSG91 webhook] failed to update requestId=${report.requestId}:`,
        error instanceof Error ? error.message : error,
      );
    }
  }

  // Always 200 so MSG91 doesn't disable the webhook on transient issues
  return NextResponse.json({ success: true, processed: reports.length });
}

// MSG91 may probe the URL when saving the webhook configuration
export async function GET() {
  return NextResponse.json({ success: true });
}
