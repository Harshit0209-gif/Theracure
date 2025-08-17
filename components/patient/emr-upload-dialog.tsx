import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Upload,
  X,
  FileText,
  Image,
  File,
  Plus,
  AlertCircle,
  CheckCircle,
  Loader2,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface EMRUploadDialogProps {
  patientId: string;
  onUploadComplete?: () => void;
}

export function EMRUploadDialog({
  patientId,
  onUploadComplete,
}: EMRUploadDialogProps) {
  const [open, setOpen] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [formData, setFormData] = useState({
    documentType: "",
    category: "",
    description: "",
    tags: "",
    isPublicToPatient: false,
  });

  const documentTypes = [
    { value: "PRESCRIPTION", label: "Prescription" },
    { value: "DIAGNOSTIC", label: "Diagnostic Report" },
    { value: "NOTES", label: "Clinical Notes" },
    { value: "THERAPY_SUMMARY", label: "Therapy Summary" },
    { value: "LAB_REPORT", label: "Lab Report" },
    { value: "XRAY", label: "X-Ray" },
    { value: "MRI", label: "MRI Report" },
    { value: "CT_SCAN", label: "CT Scan" },
    { value: "ULTRASOUND", label: "Ultrasound" },
    { value: "OTHER", label: "Other" },
  ];

  const onDrop = useCallback((acceptedFiles: File[]) => {
    // Validate files
    const validFiles = acceptedFiles.filter((file) => {
      const supportedTypes = [
        "application/pdf",
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/webp",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ];

      const isValidType = supportedTypes.includes(file.type);
      const maxSize =
        file.type === "application/pdf" ? 10 * 1024 * 1024 : 5 * 1024 * 1024;
      const isValidSize = file.size <= maxSize;

      if (!isValidType) {
        toast({
          title: "Invalid file type",
          description: `${file.name} is not a supported file type`,
          variant: "destructive",
        });
        return false;
      }

      if (!isValidSize) {
        const limit = file.type === "application/pdf" ? "10MB" : "5MB";
        toast({
          title: "File too large",
          description: `${file.name} exceeds the ${limit} size limit`,
          variant: "destructive",
        });
        return false;
      }

      return true;
    });

    // Add valid files (max 10 total)
    setFiles((prev) => {
      const newFiles = [...prev, ...validFiles];
      if (newFiles.length > 10) {
        toast({
          title: "Too many files",
          description: "Maximum 10 files can be uploaded at once",
          variant: "destructive",
        });
        return newFiles.slice(0, 10);
      }
      return newFiles;
    });
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "image/*": [".png", ".jpg", ".jpeg", ".webp"],
      "application/msword": [".doc"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
        [".docx"],
    },
    maxFiles: 10,
    multiple: true,
  });

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const getFileIcon = (type: string) => {
    if (type === "application/pdf")
      return <FileText className="h-5 w-5 text-red-500" />;
    if (type.startsWith("image/"))
      return <Image className="h-5 w-5 text-blue-500" />;
    return <File className="h-5 w-5 text-gray-500" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      toast({
        title: "No files selected",
        description: "Please select at least one file to upload",
        variant: "destructive",
      });
      return;
    }

    if (!formData.documentType) {
      toast({
        title: "Document type required",
        description: "Please select a document type",
        variant: "destructive",
      });
      return;
    }

    try {
      setUploading(true);
      setUploadProgress(0);

      const uploadFormData = new FormData();

      // Add files
      files.forEach((file) => {
        uploadFormData.append("files", file);
      });

      // Add metadata
      const uploadData = {
        patientId,
        documentType: formData.documentType,
        category: formData.category,
        description: formData.description,
        tags: formData.tags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
        accessPermissions: {
          canView: [],
          canDownload: [],
          isPublicToPatient: formData.isPublicToPatient,
          restrictedAccess: false,
        },
      };

      uploadFormData.append("data", JSON.stringify(uploadData));

      // Upload with progress tracking
      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener("progress", (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100);
          setUploadProgress(progress);
        }
      });

      const response = await new Promise<Response>((resolve, reject) => {
        xhr.onload = () =>
          resolve(new Response(xhr.response, { status: xhr.status }));
        xhr.onerror = () => reject(new Error("Upload failed"));
        xhr.open("POST", "/api/emr/upload");
        xhr.send(uploadFormData);
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: "Upload successful",
          description: `${
            result.uploadedRecords?.length || 0
          } file(s) uploaded successfully`,
        });

        // Reset form and close dialog
        handleCloseDialog();
        onUploadComplete?.();
      } else {
        throw new Error(result.error || "Upload failed");
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast({
        title: "Upload failed",
        description:
          error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleCloseDialog = () => {
    setOpen(false);
    setFiles([]);
    setFormData({
      documentType: "",
      category: "",
      description: "",
      tags: "",
      isPublicToPatient: false,
    });
    setUploadProgress(0);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-indigo-600 hover:bg-indigo-700 text-white">
          <Upload className="h-4 w-4 mr-2" />
          Upload EMR
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">Upload Medical Records</DialogTitle>
          <DialogDescription>
            Upload medical documents, prescriptions, and reports for this
            patient
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Document Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="documentType">Document Type *</Label>
              <Select
                value={formData.documentType}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, documentType: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select document type" />
                </SelectTrigger>
                <SelectContent>
                  {documentTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Input
                id="category"
                value={formData.category}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, category: e.target.value }))
                }
                placeholder="e.g., Initial Assessment, Follow-up"
                maxLength={100}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              placeholder="Brief description of the document(s)"
              rows={3}
              maxLength={500}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tags">Tags</Label>
            <Input
              id="tags"
              value={formData.tags}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, tags: e.target.value }))
              }
              placeholder="Comma-separated tags (e.g., urgent, follow-up, initial)"
            />
            <p className="text-xs text-gray-500">
              Separate multiple tags with commas
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="isPublicToPatient"
              checked={formData.isPublicToPatient}
              onCheckedChange={(checked) =>
                setFormData((prev) => ({
                  ...prev,
                  isPublicToPatient: !!checked,
                }))
              }
            />
            <Label htmlFor="isPublicToPatient" className="text-sm">
              Allow patient to view and download this document
            </Label>
          </div>

          {/* File Upload Area */}
          <div className="space-y-4">
            <Label>Upload Files</Label>
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer ${
                isDragActive
                  ? "border-indigo-500 bg-indigo-50"
                  : "border-gray-300 hover:border-indigo-400"
              }`}
            >
              <input {...getInputProps()} />
              <div className="space-y-2">
                <Upload className="h-8 w-8 text-gray-400 mx-auto" />
                <div className="text-sm text-gray-600">
                  {isDragActive ? (
                    <p>Drop the files here...</p>
                  ) : (
                    <div>
                      <p>
                        <strong>Click to upload</strong> or drag and drop
                      </p>
                      <p className="text-xs text-gray-500">
                        PDF, PNG, JPG, WEBP, DOC, DOCX (max 10MB for PDF, 5MB
                        for images)
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* File Size Limits Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">File Requirements:</p>
                  <ul className="space-y-1 text-xs">
                    <li>• PDF files: Max 10MB</li>
                    <li>• Image files (PNG, JPG, WEBP): Max 5MB</li>
                    <li>• Document files (DOC, DOCX): Max 10MB</li>
                    <li>• Maximum 10 files per upload</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Selected Files List */}
          {files.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Selected Files ({files.length}/10)</Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setFiles([])}
                  className="text-red-600 hover:text-red-700"
                >
                  Clear All
                </Button>
              </div>

              <div className="space-y-2 max-h-48 overflow-y-auto border rounded-lg p-3">
                {files.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      {getFileIcon(file.type)}
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-sm text-gray-900 truncate">
                          {file.name}
                        </p>
                        <p className="text-xs text-gray-600">
                          {formatFileSize(file.size)}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(index)}
                      className="text-red-500 hover:text-red-700 p-1"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Upload Progress */}
          {uploading && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Uploading files...</span>
                <span className="text-gray-900 font-medium">
                  {uploadProgress}%
                </span>
              </div>
              <Progress value={uploadProgress} className="w-full" />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleCloseDialog}
            disabled={uploading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleUpload}
            disabled={uploading || files.length === 0 || !formData.documentType}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            {uploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Upload {files.length} File{files.length !== 1 ? "s" : ""}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
