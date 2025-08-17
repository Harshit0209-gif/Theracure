import { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Search,
  Download,
  Eye,
  MoreHorizontal,
  FileText,
  Image,
  File,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Filter,
  Loader2,
  Trash2,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface MedicalRecord {
  id: string;
  documentType: string;
  fileName: string;
  originalFileName: string;
  fileSize: number;
  mimeType: string;
  uploadDate: string;
  category?: string;
  description?: string;
  tags: string[];
  uploadedByUser: {
    name: string;
    role: string;
  };
}

interface EMRTableViewProps {
  patientId: string;
  refreshTrigger?: number;
}

export function EMRTableView({ patientId, refreshTrigger }: EMRTableViewProps) {
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [documentTypeFilter, setDocumentTypeFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 10;

  const documentTypes = [
    { value: "ALL", label: "All Types" },
    { value: "PRESCRIPTION", label: "Prescription" },
    { value: "DIAGNOSTIC", label: "Diagnostic" },
    { value: "NOTES", label: "Notes" },
    { value: "THERAPY_SUMMARY", label: "Therapy Summary" },
    { value: "LAB_REPORT", label: "Lab Report" },
    { value: "XRAY", label: "X-Ray" },
    { value: "MRI", label: "MRI" },
    { value: "CT_SCAN", label: "CT Scan" },
    { value: "ULTRASOUND", label: "Ultrasound" },
    { value: "OTHER", label: "Other" },
  ];

  // Fetch EMR records
  const fetchEMRRecords = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        patientId,
        page: currentPage.toString(),
        limit: pageSize.toString(),
        ...(searchQuery && { search: searchQuery }),
        ...(documentTypeFilter &&
          documentTypeFilter !== "ALL" && { documentType: documentTypeFilter }),
      });

      const response = await fetch(`/api/patients/${patientId}/emr?${params}`);

      if (!response.ok) {
        throw new Error("Failed to fetch EMR records");
      }

      const data = await response.json();

      if (data.success) {
        setRecords(data.records);
        setTotalPages(data.pagination.totalPages);
        setTotalCount(data.pagination.totalCount);
      } else {
        throw new Error(data.error || "Failed to fetch records");
      }
    } catch (error) {
      console.error("Error fetching EMR records:", error);
      toast({
        title: "Error",
        description: "Failed to load medical records",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Initial load and refresh on trigger change
  useEffect(() => {
    fetchEMRRecords();
  }, [patientId, currentPage, refreshTrigger]);

  // Search and filter with debounce
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setCurrentPage(1);
      fetchEMRRecords();
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, documentTypeFilter]);

  const getFileIcon = (mimeType: string) => {
    if (mimeType === "application/pdf")
      return <FileText className="h-4 w-4 text-red-500" />;
    if (mimeType.startsWith("image/"))
      return <Image className="h-4 w-4 text-blue-500" />;
    return <File className="h-4 w-4 text-gray-500" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getDocumentTypeColor = (type: string) => {
    const colors = {
      PRESCRIPTION: "bg-blue-100 text-blue-800",
      DIAGNOSTIC: "bg-green-100 text-green-800",
      NOTES: "bg-yellow-100 text-yellow-800",
      THERAPY_SUMMARY: "bg-purple-100 text-purple-800",
      LAB_REPORT: "bg-red-100 text-red-800",
      XRAY: "bg-gray-100 text-gray-800",
      MRI: "bg-indigo-100 text-indigo-800",
      CT_SCAN: "bg-cyan-100 text-cyan-800",
      ULTRASOUND: "bg-teal-100 text-teal-800",
      OTHER: "bg-gray-100 text-gray-800",
    };
    return colors[type as keyof typeof colors] || "bg-gray-100 text-gray-800";
  };

  const handleDownload = async (recordId: string, fileName: string) => {
    try {
      const response = await fetch(`/api/emr/${recordId}/download`);

      if (!response.ok) {
        throw new Error("Download failed");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.style.display = "none";
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Download started",
        description: `Downloading ${fileName}`,
      });
    } catch (error) {
      console.error("Download error:", error);
      toast({
        title: "Download failed",
        description: "Could not download the file",
        variant: "destructive",
      });
    }
  };

  const handleView = async (recordId: string) => {
    // For now, just download. In future, could implement viewer
    const record = records.find((r) => r.id === recordId);
    if (record) {
      handleDownload(recordId, record.originalFileName);
    }
  };

  return (
    <div className="space-y-4">
      {/* Search and Filter Controls */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search by filename, description, or tags..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Select
          value={documentTypeFilter || "ALL"}
          onValueChange={(value) =>
            setDocumentTypeFilter(value === "ALL" ? "" : value)
          }
        >
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Filter by type" />
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

      {/* EMR Table */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead className="font-semibold">Document</TableHead>
              <TableHead className="font-semibold">Type</TableHead>
              <TableHead className="font-semibold">Size</TableHead>
              <TableHead className="font-semibold">Uploaded By</TableHead>
              <TableHead className="font-semibold">Upload Date</TableHead>
              <TableHead className="font-semibold text-center">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-gray-600">
                      Loading medical records...
                    </span>
                  </div>
                </TableCell>
              </TableRow>
            ) : records.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  <div className="space-y-2">
                    <FileText className="h-8 w-8 text-gray-400 mx-auto" />
                    <p className="text-gray-500">
                      {searchQuery || documentTypeFilter
                        ? "No medical records found matching your criteria"
                        : "No medical records uploaded yet"}
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              records.map((record, index) => (
                <TableRow key={record.id} className="hover:bg-gray-50">
                  <TableCell>
                    <div className="flex items-start gap-3">
                      {getFileIcon(record.mimeType)}
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-gray-900 truncate">
                          {record.originalFileName}
                        </p>
                        {record.description && (
                          <p className="text-sm text-gray-600 truncate">
                            {record.description}
                          </p>
                        )}
                        {record.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {record.tags.slice(0, 2).map((tag, idx) => (
                              <Badge
                                key={idx}
                                variant="outline"
                                className="text-xs"
                              >
                                {tag}
                              </Badge>
                            ))}
                            {record.tags.length > 2 && (
                              <Badge variant="outline" className="text-xs">
                                +{record.tags.length - 2}
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={getDocumentTypeColor(record.documentType)}
                    >
                      {record.documentType.replace("_", " ")}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-gray-600">
                    {formatFileSize(record.fileSize)}
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <p className="font-medium text-gray-900">
                        {record.uploadedByUser.name}
                      </p>
                      <p className="text-gray-600 capitalize">
                        {record.uploadedByUser.role.toLowerCase()}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(record.uploadDate).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </div>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => handleView(record.id)}
                          className="flex items-center gap-2"
                        >
                          <Eye className="h-4 w-4" />
                          View
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() =>
                            handleDownload(record.id, record.originalFileName)
                          }
                          className="flex items-center gap-2"
                        >
                          <Download className="h-4 w-4" />
                          Download
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-red-600 flex items-center gap-2">
                          <Trash2 className="h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {!loading && records.length > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-700">
            Showing {(currentPage - 1) * pageSize + 1} to{" "}
            {Math.min(currentPage * pageSize, totalCount)} of {totalCount}{" "}
            records
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>

            {/* Page numbers */}
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pageNum = currentPage <= 3 ? i + 1 : currentPage - 2 + i;
                if (pageNum > totalPages) return null;

                return (
                  <Button
                    key={pageNum}
                    variant={pageNum === currentPage ? "default" : "outline"}
                    size="sm"
                    className="w-8 h-8 p-0"
                    onClick={() => setCurrentPage(pageNum)}
                  >
                    {pageNum}
                  </Button>
                );
              })}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setCurrentPage((prev) => Math.min(totalPages, prev + 1))
              }
              disabled={currentPage === totalPages}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Summary Stats */}
      {!loading && records.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t">
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">{totalCount}</p>
            <p className="text-sm text-gray-600">Total Records</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600">
              {records.filter((r) => r.documentType === "PRESCRIPTION").length}
            </p>
            <p className="text-sm text-gray-600">Prescriptions</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">
              {records.filter((r) => r.documentType === "DIAGNOSTIC").length}
            </p>
            <p className="text-sm text-gray-600">Diagnostics</p>
          </div>
        </div>
      )}
    </div>
  );
}
