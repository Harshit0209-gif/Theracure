export const generateInvoiceId = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const random = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, "0");
  return `TC${year}${month}${random}`;
};

/**
 * Generate unique file name using patientId, timestamp, and original file extension
 */
export const generateUniqueFileName = (
  originalFileName: string,
  patientId: string
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
