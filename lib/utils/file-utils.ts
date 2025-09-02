/**
 * File utility functions for EMR uploads
 */

export interface FileInfo {
  name: string;
  size: number;
  type: string;
  lastModified: number;
}

/**
 * Get file extension from filename
 */
export function getFileExtension(filename: string): string {
  return filename.slice(((filename.lastIndexOf(".") - 1) >>> 0) + 2);
}

/**
 * Get file size in human readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

/**
 * Check if file type is allowed
 */
export function isAllowedFileType(fileType: string): boolean {
  const allowedTypes = [
    "application/pdf",
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/gif",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "text/plain",
  ];

  return allowedTypes.includes(fileType);
}

/**
 * Get file type category
 */
export function getFileTypeCategory(fileType: string): string {
  if (fileType.startsWith("image/")) return "image";
  if (fileType === "application/pdf") return "pdf";
  if (fileType.includes("word")) return "document";
  if (fileType === "text/plain") return "text";
  return "other";
}

/**
 * Validate file size
 */
export function validateFileSize(
  size: number,
  maxSize: number = 50 * 1024 * 1024
): boolean {
  return size > 0 && size <= maxSize;
}

/**
 * Generate safe filename
 */
export function generateSafeFilename(originalName: string): string {
  // Remove special characters and spaces
  const safeName = originalName
    .replace(/[^a-zA-Z0-9.-]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "");

  return safeName;
}

/**
 * Create file path for S3
 */
export function createFilePath(
  patientId: string,
  filename: string,
  documentType: string
): string {
  const timestamp = Date.now();
  const safeFilename = generateSafeFilename(filename);
  return `emr/${patientId}/${documentType.toLowerCase()}/${timestamp}_${safeFilename}`;
}

/**
 * Extract file information from File object
 */
export function extractFileInfo(file: File): FileInfo {
  return {
    name: file.name,
    size: file.size,
    type: file.type,
    lastModified: file.lastModified,
  };
}
