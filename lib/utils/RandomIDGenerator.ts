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
