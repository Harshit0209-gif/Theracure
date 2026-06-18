export async function generateSequentialInvoiceId(
  tx: Parameters<
    Parameters<import("@prisma/client").PrismaClient["$transaction"]>[0]
  >[0],
): Promise<string> {
  const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
  const nowIST = new Date(Date.now() + IST_OFFSET_MS);
  const year = nowIST.getUTCFullYear();
  const month = String(nowIST.getUTCMonth() + 1).padStart(2, "0");
  const prefix = `TC${year}${month}`;

  const latest = await tx.invoice.findFirst({
    where: { id: { startsWith: prefix } },
    orderBy: { id: "desc" },
    select: { id: true },
  });

  const lastSerial = latest ? parseInt(latest.id.slice(prefix.length), 10) : 0;
  const nextSerial = String(lastSerial + 1).padStart(3, "0");
  return `${prefix}${nextSerial}`;
}

export const generateUniqueFileName = (
  originalFileName: string,
  patientId: string,
): string => {
  const date = new Date();
  const timestamp = date.getTime();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, "");
  const timeStr = date.toISOString().slice(11, 19).replace(/:/g, "");

  // Get file extension
  const lastDotIndex = originalFileName.lastIndexOf(".");
  const extension =
    lastDotIndex !== -1 ? originalFileName.slice(lastDotIndex) : "";
  const nameWithoutExtension =
    lastDotIndex !== -1
      ? originalFileName.slice(0, lastDotIndex)
      : originalFileName;

  const cleanName = nameWithoutExtension
    .replace(/[^a-zA-Z0-9\s]/g, "")
    .replace(/\s+/g, "_")
    .slice(0, 20);
  const uniqueFileName = `${patientId}_${dateStr}_${timeStr}_${cleanName}_${timestamp}${extension}`;

  return uniqueFileName;
};
