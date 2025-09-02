export type DocumentType =
  | "PRESCRIPTION"
  | "DIAGNOSTIC"
  | "NOTES"
  | "THERAPY_SUMMARY"
  | "LAB_REPORT"
  | "XRAY"
  | "MRI"
  | "CT_SCAN"
  | "ULTRASOUND"
  | "OTHER";

export interface AccessPermissions {
  canView?: string[];
  canEdit?: string[];
  canDelete?: string[];
}

export interface PrescriptionData {
  medicationName?: string;
  dosage?: string;
  frequency?: string;
  duration?: string;
  instructions?: string;
  prescribedBy?: string;
  prescribedDate?: string;
}

export interface EMRUploadRequest {
  patientId: string;
  documentType: DocumentType;
  category?: string;
  description?: string;
  tags?: string[];
  accessPermissions?: AccessPermissions;
  prescriptionData?: PrescriptionData;
}

export interface MedicalRecord {
  id: string;
  patientId: string;
  documentType: DocumentType;
  mimeType: string;
  fileName: string;
  originalFileName: string;
  filePath: string;
  fileUrl?: string;
  fileSize: number;
  uploadedBy: string;
  uploadDate: Date;
  tags: string[];
  category?: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
  patient?: {
    id: string;
    patientName: string;
  };
  uploadedByUser?: {
    id: string;
    name: string;
    role: string;
  };
}

export interface FileUploadResult {
  success: boolean;
  fileId?: string;
  fileName: string;
  fileUrl?: string;
  fileSize: number;
  error?: string;
}

export interface EMRUploadResponse {
  success: boolean;
  message: string;
  uploadedRecords: FileUploadResult[];
  failures?: FileUploadResult[];
}

export interface EMRFilters {
  documentType?: DocumentType;
  category?: string;
  tags?: string[];
  dateFrom?: Date;
  dateTo?: Date;
  uploadedBy?: string;
}

export interface EMRSearchParams {
  page?: number;
  limit?: number;
  search?: string;
  documentType?: DocumentType;
  sortBy?: "uploadDate" | "fileName" | "fileSize" | "documentType";
  sortOrder?: "asc" | "desc";
  filters?: EMRFilters;
}

export interface EMRPagination {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  limit: number;
}

export interface EMRListResponse {
  success: boolean;
  records: MedicalRecord[];
  pagination: EMRPagination;
}

export interface EMRTableViewProps {
  patientId: string;
  refreshTrigger?: number;
}

export interface FileUploadData {
  buffer: Buffer;
  originalName: string;
  mimeType: string;
  size: number;
}

export interface UploadMetadata {
  patientId: string;
  documentType: string;
  category?: string;
  description?: string;
  tags?: string[];
  uploadedBy: string;
}

export interface UploadResult {
  success: boolean;
  fileId?: string;
  fileName: string;
  fileUrl?: string;
  fileSize: number;
  error?: string;
}

export interface S3UploadConfig {
  bucketUrl: string;
  bucketName: string;
  accessKeyId: string;
  secretAccessKey: string;
}

export interface S3UploadResult {
  success: boolean;
  fileUrl?: string;
  error?: string;
}
