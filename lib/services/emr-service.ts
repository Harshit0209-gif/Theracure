import { prisma } from "@/lib/prisma";
import { EMRUploadRequestSchema, validateFiles } from "@/lib/validations/emr";
import { generateUniqueFileName } from "@/lib/utils/RandomIDGenerator";
import {
  DocumentType,
  FileUploadData,
  UploadMetadata,
  UploadResult,
} from "@/types/emr";
import { s3Service } from "./s3-service";
import { metadata } from "@/app/layout";

export class EMRService {
  /**
   * Upload multiple files to S3 and save metadata to database
   */
  async uploadFiles(
    files: FileUploadData[],
    metadata: UploadMetadata
  ): Promise<UploadResult[]> {
    const results: UploadResult[] = [];

    for (const file of files) {
      try {
        const result = await this.uploadSingleFile(file, metadata);
        results.push(result);
      } catch (error) {
        console.error(`Error uploading file ${file.originalName}:`, error);
        results.push({
          success: false,
          fileName: file.originalName,
          fileSize: file.size,
          error: error instanceof Error ? error.message : "Upload failed",
        });
      }
    }

    return results;
  }

  /**
   * Upload a single file to S3 and save to database
   */
  private async uploadSingleFile(
    file: FileUploadData,
    metadata: UploadMetadata
  ): Promise<UploadResult> {
    try {
      const uniqueFileName = generateUniqueFileName(
        file.originalName,
        metadata.patientId
      );

      const filePath = `emr/${metadata.patientId}/${uniqueFileName}`;

      const s3Result = await s3Service.uploadFile(
        filePath,
        file.buffer,
        file.mimeType || "application/octet-stream"
      );

      if (!s3Result.success) {
        throw new Error(s3Result.error);
      }

      const dbRecord = await this.saveToDatabase({
        patientId: metadata.patientId,
        documentType: metadata.documentType,
        fileName: uniqueFileName,
        originalFileName: file.originalName,
        filePath: filePath,
        fileUrl: s3Result.fileUrl,
        fileSize: file.size,
        uploadedBy: metadata.uploadedBy,
        category: metadata.category,
        description: metadata.description,
        tags: metadata.tags || [],
      });

      return {
        success: true,
        fileId: dbRecord.id,
        fileName: file.originalName,
        fileUrl: s3Result.fileUrl,
        fileSize: file.size,
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Save EMR record to database
   */
  private async saveToDatabase(data: {
    patientId: string;
    documentType: string;
    fileName: string;
    originalFileName: string;
    filePath: string;
    fileUrl?: string;
    fileSize: number;
    uploadedBy: string;
    category?: string;
    description?: string;
    tags: string[];
  }) {
    try {
      const record = await prisma.medicalRecord.create({
        data: {
          patientId: data.patientId,
          documentType: data.documentType as DocumentType,
          fileName: data.fileName,
          originalFileName: data.originalFileName,
          filePath: data.filePath,
          fileUrl: data.fileUrl,
          fileSize: data.fileSize,
          uploadedBy: data.uploadedBy,
          category: data.category,
          description: data.description,
          tags: data.tags,
        },
        include: {
          patient: {
            select: {
              id: true,
              patientName: true,
            },
          },
          uploadedByUser: {
            select: {
              id: true,
              name: true,
              role: true,
            },
          },
        },
      });

      console.log(`EMR record saved to database: ${record.id}`);
      return record;
    } catch (error) {
      console.error("Database save failed:", error);
      throw new Error("Failed to save EMR record to database");
    }
  }

  /**
   * Delete a file from S3 and database
   */
  async deleteFile(
    fileId: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      const fileRecord = await prisma.medicalRecord.findUnique({
        where: { id: fileId },
      });

      if (!fileRecord) {
        throw new Error("File not found in database");
      }

      const s3Result = await s3Service.deleteFile(fileRecord.filePath);

      if (!s3Result.success) {
        throw new Error(s3Result.error || "Failed to delete file from S3");
      }

      await prisma.medicalRecord.delete({
        where: { id: fileId },
      });

      console.log(
        `File deleted successfully: ${fileRecord.fileName} from database`
      );

      return { success: true, message: "File deleted successfully" };
    } catch (error) {
      console.error(`Error deleting file:`, error);
      return {
        success: false,
        message:
          error instanceof Error ? error.message : "File deletion failed",
      };
    }
  }

  /**
   * Generate url the upload file for view
   */
  async generateViewUrl(fileId: string): Promise<string> {
    const fileRecord = await prisma.medicalRecord.findUnique({
      where: { id: fileId },
    });

    if (!fileRecord) {
      throw new Error("File not found in database");
    }

    return await s3Service.generatePresignedUrl(fileRecord.filePath);
  }

  /**
   * Validate upload request
   */
  validateUploadRequest(data: any) {
    return EMRUploadRequestSchema.parse(data);
  }

  /**
   * Validate files
   */
  validateFiles(files: File[]) {
    return validateFiles(files);
  }
}

export const emrService = new EMRService();
