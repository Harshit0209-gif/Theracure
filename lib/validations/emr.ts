import { z } from "zod";

export const DocumentTypeSchema = z.enum([
  "PRESCRIPTION",
  "DIAGNOSTIC",
  "NOTES",
  "THERAPY_SUMMARY",
  "LAB_REPORT",
  "XRAY",
  "MRI",
  "CT_SCAN",
  "ULTRASOUND",
  "OTHER",
]);

// File validation schema
export const FileSchema = z.object({
  name: z.string().min(1, "File name is required"),
  size: z.number().min(1, "File size must be greater than 0"),
  type: z.string().min(1, "File type is required"),
});

// Access permissions schema
export const AccessPermissionsSchema = z.object({
  canView: z.array(z.string()).optional(),
  canEdit: z.array(z.string()).optional(),
  canDelete: z.array(z.string()).optional(),
});

// Prescription data schema (for prescription documents)
export const PrescriptionDataSchema = z
  .object({
    medicationName: z.string().optional(),
    dosage: z.string().optional(),
    frequency: z.string().optional(),
    duration: z.string().optional(),
    instructions: z.string().optional(),
    prescribedBy: z.string().optional(),
    prescribedDate: z.string().optional(),
  })
  .optional();

// Main EMR upload request schema
export const EMRUploadRequestSchema = z.object({
  patientId: z.string(),
  documentType: DocumentTypeSchema,
  category: z.string().optional(),
  description: z.string().optional(),
  tags: z.array(z.string()).optional(),
  accessPermissions: AccessPermissionsSchema.optional(),
  prescriptionData: PrescriptionDataSchema,
});

// File upload response schema
export const FileUploadResponseSchema = z.object({
  success: z.boolean(),
  fileId: z.string().optional(),
  fileName: z.string(),
  fileUrl: z.string().optional(),
  fileSize: z.number(),
  error: z.string().optional(),
});

// EMR upload response schema
export const EMRUploadResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  uploadedRecords: z.array(FileUploadResponseSchema),
  failures: z.array(FileUploadResponseSchema).optional(),
});

// File validation for upload
export const validateFiles = (files: File[]) => {
  const errors: string[] = [];

  if (!files || files.length === 0) {
    errors.push("At least one file is required");
    return errors;
  }

  if (files.length > 10) {
    errors.push("Maximum 10 files allowed per upload");
    return errors;
  }

  // Validate each file
  files.forEach((file, index) => {
    if (file.size === 0) {
      errors.push(`File ${index + 1}: File is empty`);
    }

    if (file.size > 50 * 1024 * 1024) {
      // 50MB limit
      errors.push(`File ${index + 1}: File size exceeds 50MB limit`);
    }

    // Validate file types
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

    if (!allowedTypes.includes(file.type)) {
      errors.push(
        `File ${
          index + 1
        }: Unsupported file type. Allowed: PDF, Images, Word docs, Text files`
      );
    }
  });

  return errors;
};
