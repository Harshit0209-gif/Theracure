import { S3UploadConfig, S3UploadResult } from "@/types/emr";
import {
  PutObjectCommand,
  S3Client,
  DeleteObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export class UthoS3Service {
  private client: S3Client;
  private bucketUrl: string;
  private bucketName: string;

  constructor(config: S3UploadConfig) {
    this.bucketUrl = config.bucketUrl;
    this.bucketName = config.bucketName;
    this.client = new S3Client({
      region: "auto",
      endpoint: this.bucketUrl,
      forcePathStyle: false,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
    });
  }

  /**
   * Upload file to Utho S3
   */
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
      console.log("upload-url: ", fileUrl, "file-path: ", filePath);

      return {
        success: true,
        fileUrl,
      };
    } catch (error) {
      console.error("Utho S3 upload error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Upload failed",
      };
    }
  }

  /**
   * Generate presigned URL for file upload
   */
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

  /**
   * Delete file from Utho S3
   */
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
      console.error("Utho S3 delete error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Delete failed",
      };
    }
  }
}

// Factory function
export function createUthoS3Service(): UthoS3Service {
  return new UthoS3Service({
    bucketUrl: process.env.UTHO_ENDPOINT!,
    bucketName: process.env.UTHO_S3_BUCKET_NAME!,
    accessKeyId: process.env.UTHO_ACCESS_KEY!,
    secretAccessKey: process.env.UTHO_SECRET_KEY!,
  });
}

export const s3Service = createUthoS3Service();
