/**
 * Storage Factory - Supports multiple storage providers
 * Can switch between S3-compatible services (Utho, Cloudflare R2, AWS S3, etc.)
 * or local filesystem storage
 */

import { S3UploadConfig, S3UploadResult } from "@/types/emr";
import {
  PutObjectCommand,
  S3Client,
  DeleteObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import fs from "fs/promises";
import path from "path";

// Storage provider types
export type StorageProvider = "utho" | "cloudflare-r2" | "aws-s3" | "local";

// Base interface for all storage providers
export interface IStorageService {
  uploadFile(
    filePath: string,
    fileBuffer: Buffer,
    contentType: string
  ): Promise<S3UploadResult>;
  deleteFile(filePath: string): Promise<S3UploadResult>;
  generatePresignedUrl(filePath: string, expiresIn?: number): Promise<string>;
}

/**
 * S3-Compatible Storage Service (Utho, Cloudflare R2, AWS S3, DigitalOcean Spaces, etc.)
 */
export class S3CompatibleStorage implements IStorageService {
  private client: S3Client;
  private bucketUrl: string;
  private bucketName: string;
  private provider: string;

  constructor(config: S3UploadConfig & { provider?: string }) {
    this.bucketUrl = config.bucketUrl;
    this.bucketName = config.bucketName;
    this.provider = config.provider || "S3-Compatible";

    this.client = new S3Client({
      region: config.region || "auto",
      endpoint: this.bucketUrl,
      forcePathStyle: false,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
    });
  }

  async uploadFile(
    filePath: string,
    fileBuffer: Buffer,
    contentType: string
  ): Promise<S3UploadResult> {
    try {
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: filePath,
        Body: fileBuffer,
        ContentType: contentType,
      });

      await this.client.send(command);

      const fileUrl = `${this.bucketUrl}/${filePath}`;
      console.log(
        `[${this.provider}] File uploaded:`,
        fileUrl,
        "path:",
        filePath
      );

      return {
        success: true,
        fileUrl,
      };
    } catch (error) {
      console.error(`[${this.provider}] Upload error:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Upload failed",
      };
    }
  }

  async generatePresignedUrl(
    filePath: string,
    expiresIn = 3600
  ): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: filePath,
    });

    return await getSignedUrl(this.client, command, { expiresIn });
  }

  async deleteFile(filePath: string): Promise<S3UploadResult> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: filePath,
      });

      await this.client.send(command);

      return {
        success: true,
      };
    } catch (error) {
      console.error(`[${this.provider}] Delete error:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Delete failed",
      };
    }
  }
}

/**
 * Local Filesystem Storage (for Hostinger without object storage)
 */
export class LocalFileStorage implements IStorageService {
  private baseDir: string;
  private publicUrl: string;

  constructor(config: { baseDir: string; publicUrl: string }) {
    this.baseDir = config.baseDir;
    this.publicUrl = config.publicUrl;
  }

  async uploadFile(
    filePath: string,
    fileBuffer: Buffer,
    contentType: string
  ): Promise<S3UploadResult> {
    try {
      const fullPath = path.join(this.baseDir, filePath);
      const directory = path.dirname(fullPath);

      // Create directory if it doesn't exist
      await fs.mkdir(directory, { recursive: true });

      // Write file
      await fs.writeFile(fullPath, fileBuffer);

      const fileUrl = `${this.publicUrl}/${filePath}`;
      console.log("[Local Storage] File uploaded:", fileUrl);

      return {
        success: true,
        fileUrl,
      };
    } catch (error) {
      console.error("[Local Storage] Upload error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Upload failed",
      };
    }
  }

  async generatePresignedUrl(
    filePath: string,
    expiresIn = 3600
  ): Promise<string> {
    // For local storage, just return the public URL
    // In production, you might want to add a token-based auth
    return `${this.publicUrl}/${filePath}`;
  }

  async deleteFile(filePath: string): Promise<S3UploadResult> {
    try {
      const fullPath = path.join(this.baseDir, filePath);
      await fs.unlink(fullPath);

      return {
        success: true,
      };
    } catch (error) {
      console.error("[Local Storage] Delete error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Delete failed",
      };
    }
  }
}

/**
 * Storage Factory - Creates the appropriate storage service based on configuration
 */
export function createStorageService(): IStorageService {
  const provider = (process.env.STORAGE_PROVIDER || "utho") as StorageProvider;

  console.log(`[Storage Factory] Initializing storage provider: ${provider}`);

  switch (provider) {
    case "cloudflare-r2":
      return new S3CompatibleStorage({
        provider: "Cloudflare R2",
        bucketUrl: process.env.CLOUDFLARE_R2_ENDPOINT!,
        bucketName: process.env.CLOUDFLARE_R2_BUCKET_NAME!,
        accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID!,
        secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY!,
        region: "auto",
      });

    case "aws-s3":
      return new S3CompatibleStorage({
        provider: "AWS S3",
        bucketUrl: `https://s3.${process.env.AWS_REGION}.amazonaws.com/${process.env.AWS_S3_BUCKET_NAME}`,
        bucketName: process.env.AWS_S3_BUCKET_NAME!,
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
        region: process.env.AWS_REGION || "us-east-1",
      });

    case "local":
      return new LocalFileStorage({
        baseDir: process.env.LOCAL_STORAGE_PATH || "./uploads",
        publicUrl: process.env.LOCAL_STORAGE_PUBLIC_URL || "/uploads",
      });

    case "utho":
    default:
      return new S3CompatibleStorage({
        provider: "Utho S3",
        bucketUrl: process.env.UTHO_ENDPOINT!,
        bucketName: process.env.UTHO_S3_BUCKET_NAME!,
        accessKeyId: process.env.UTHO_ACCESS_KEY!,
        secretAccessKey: process.env.UTHO_SECRET_KEY!,
        region: "auto",
      });
  }
}

export const storageService = createStorageService();
