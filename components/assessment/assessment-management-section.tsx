import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  FileText,
  User,
  Eye,
  CheckCircle,
  Clock,
} from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { toast } from "@/hooks/use-toast";
import { AddAssessmentDialog } from "@/components/assessment/add-assessment-form";
import { UserRole } from "@/lib/generated/userRoles";
import { PaginationDefaultValue, PaginationInfo } from "@/types";
import { PrescriptionDetailsView } from "@/components/prescription/PrescriptionDetailsView";

// Prescription interface
interface Prescription {
  id: string;
  patientId: string;
  patientName: string;
  prescribedBy: string;
  prescriptionDate: string;
  createdAt: string;
  updatedAt: string;
  therapist: {
    user: {
      name: string;
    };
  };
  patient: {
    id: string;
    patientName: string;
  };
  session?: {
    completed: boolean;
    sessionDate: string;
  };
}

interface ApiResponse {
  success: boolean;
  prescriptions: Prescription[];
  pagination: PaginationInfo;
}

export function PrescriptionManagementSection() {
  const { user } = useAuth();

  // State management
  const [searchQuery, setSearchQuery] = useState("");
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<PaginationInfo>(
    PaginationDefaultValue
  );
  const [selectedPrescriptionId, setSelectedPrescriptionId] = useState<
    string | null
  >(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  // Fetch prescriptions from API
  const fetchPrescriptions = async (
    currentPage: number = 1,
    search: string = ""
  ) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        currentPage: currentPage.toString(),
        limit: pagination.limit.toString(),
        ...(search && { search }),
        ...(user?.role === UserRole.THERAPIST && { therapistId: user.id }),
      });

      const response = await fetch(`/api/prescriptions?${params}`);

      if (!response.ok) {
        throw new Error("Failed to fetch prescriptions");
      }

      const data: ApiResponse = await response.json();

      if (data.success) {
        const transformedPrescriptions: Prescription[] = data.prescriptions.map(
          (prescription) => ({
            id: prescription.id,
            patientId: prescription.patient.id,
            patientName: prescription.patient.patientName,
            prescribedBy: prescription.therapist.user.name,
            prescriptionDate: prescription.createdAt || "Not specified",
            createdAt: prescription.createdAt,
            updatedAt: prescription.updatedAt,
            therapist: prescription.therapist,
            patient: prescription.patient,
            session: prescription.session,
          })
        );
        setPrescriptions(transformedPrescriptions);
        setPagination(data.pagination);
      } else {
        throw new Error("API returned error");
      }
    } catch (error) {
      console.error("Error fetching prescriptions:", error);
      toast({
        title: "Error",
        description: "Failed to fetch prescriptions. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchPrescriptions();
  }, []);

  // Handle search with debounce
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchPrescriptions(1, searchQuery);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  // Handle currentPage change
  const handlePageChange = (newPage: number) => {
    fetchPrescriptions(newPage, searchQuery);
  };

  // Handle prescription details view
  const handleViewDetails = (prescriptionId: string) => {
    setSelectedPrescriptionId(prescriptionId);
    setDetailsOpen(true);
  };

  // Handle PDF download
  const handleDownloadPDF = async (
    prescriptionId: string,
    patientName: string
  ) => {
    try {
      const response = await fetch(`/api/prescriptions/${prescriptionId}/pdf`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${patientName.replace(
          /\s+/g,
          "_"
        )}_Assessment_${prescriptionId.slice(0, 8)}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);

        toast({
          title: "Success",
          description: "PDF downloaded successfully",
        });
      } else {
        throw new Error("Failed to generate PDF");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to download PDF. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Format time for display
  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  // Get status badge for prescription
  const getStatusBadge = (prescription: Prescription) => {
    const isCompleted = prescription.session?.completed ?? false;

    if (isCompleted) {
      return (
        <Badge className="bg-green-100 text-green-800 hover:bg-green-200">
          <CheckCircle className="h-3 w-3 mr-1" />
          Completed
        </Badge>
      );
    } else {
      return (
        <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200">
          <Clock className="h-3 w-3 mr-1" />
          In Progress
        </Badge>
      );
    }
  };

  return (
    <div className="bg-gray-50 rounded-lg p-6 mb-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">
            Assessment Records
          </h2>
          <p className="text-gray-600 mt-1">
            Manage and view patient assessment records
          </p>
        </div>
        <div className="flex gap-3">
          <div className="relative w-80">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search by patient name, ID, or therapist..."
              className="bg-white pl-10 border border-gray-300 rounded-lg text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          {user?.role === UserRole.THERAPIST && (
            <AddAssessmentDialog
              onAssessmentAdded={() => fetchPrescriptions()}
            />
          )}
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FileText className="h-5 w-5 text-blue-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">
                  Total Records
                </p>
                <p className="text-lg font-bold text-gray-900">
                  {pagination.totalPages || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-lg font-bold text-gray-900">
                  {prescriptions.filter((p) => p.session?.completed).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">In Progress</p>
                <p className="text-lg font-bold text-gray-900">
                  {prescriptions.filter((p) => !p.session?.completed).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <User className="h-5 w-5 text-purple-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">
                  Today's Records
                </p>
                <p className="text-lg font-bold text-gray-900">
                  {
                    prescriptions.filter(
                      (p) =>
                        new Date(p.createdAt).toDateString() ===
                        new Date().toDateString()
                    ).length
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Prescriptions Table */}
      <div className="bg-white  shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-indigo-700">
              <TableHead className="text-white font-semibold">Sl. No</TableHead>
              <TableHead className="text-white font-semibold">
                Patient Name
              </TableHead>
              <TableHead className="text-white font-semibold">
                Patient Id
              </TableHead>
              <TableHead className="text-white font-semibold">
                Assessment Date
              </TableHead>
              <TableHead className="text-white font-semibold">
                Therapist
              </TableHead>

              <TableHead className="text-white font-semibold">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12">
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                    <span className="ml-3 text-gray-600">
                      Loading assessment records...
                    </span>
                  </div>
                </TableCell>
              </TableRow>
            ) : prescriptions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12">
                  <div className="flex flex-col items-center">
                    <FileText className="h-12 w-12 text-gray-300 mb-3" />
                    <p className="text-gray-500 text-lg font-medium">
                      {searchQuery
                        ? "No assessment records found matching your search."
                        : "No assessment records found."}
                    </p>
                    <p className="text-gray-400 text-sm mt-1">
                      {!searchQuery &&
                        "Create your first assessment record to get started."}
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              prescriptions.map((prescription, index) => (
                <TableRow
                  key={prescription.id}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <TableCell className="font-medium">
                    {(pagination.currentPage - 1) * pagination.limit +
                      index +
                      1}
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <p className="font-semibold text-gray-900">
                        {prescription.patientName}
                      </p>
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="space-y-1">
                      <Badge variant="outline" className="text-xs">
                        {prescription.patientId}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <p className="font-medium text-gray-900">
                        {formatDate(prescription.prescriptionDate)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatTime(prescription.prescriptionDate)}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <p className="text-gray-900">{prescription.prescribedBy}</p>
                  </TableCell>

                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Dialog
                        open={
                          detailsOpen &&
                          selectedPrescriptionId === prescription.id
                        }
                        onOpenChange={(open) => {
                          setDetailsOpen(open);
                          if (!open) setSelectedPrescriptionId(null);
                        }}
                      >
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-indigo-600 border-indigo-200 hover:bg-indigo-50"
                            onClick={() => handleViewDetails(prescription.id)}
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            View
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-7xl max-h-[95vh] overflow-y-auto p-0">
                          <DialogHeader className="sr-only">
                            <DialogTitle>Assessment Details</DialogTitle>
                          </DialogHeader>
                          {selectedPrescriptionId && (
                            <div className="p-6">
                              <PrescriptionDetailsView
                                prescriptionId={selectedPrescriptionId}
                              />
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {/* Pagination Controls */}
        {!loading && prescriptions.length > 0 && (
          <div className="flex justify-between items-center p-4 bg-gray-50 border-t">
            <div className="text-sm text-gray-600">
              Showing {(pagination.currentPage - 1) * pagination.limit + 1} to{" "}
              {Math.min(
                pagination.currentPage * pagination.limit,
                pagination.totalCount
              )}{" "}
              of {pagination.totalCount} records
            </div>
            <div className="flex items-center space-x-2">
              <Button
                size="sm"
                variant="outline"
                disabled={pagination.currentPage === 1}
                onClick={() => handlePageChange(pagination.currentPage - 1)}
                className="text-gray-600 border-gray-300 hover:bg-gray-100"
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </Button>

              {/* Page Numbers */}
              <div className="flex items-center space-x-1">
                {Array.from(
                  { length: Math.min(5, pagination.totalPages) },
                  (_, i) => {
                    const pageNum =
                      pagination.currentPage <= 3
                        ? i + 1
                        : pagination.currentPage + i - 2;

                    if (pageNum > pagination.totalPages) return null;

                    return (
                      <Button
                        key={pageNum}
                        size="sm"
                        variant={
                          pageNum === pagination.currentPage
                            ? "default"
                            : "outline"
                        }
                        className={
                          pageNum === pagination.currentPage
                            ? "bg-indigo-600 text-white hover:bg-indigo-700 w-8 h-8 p-0"
                            : "text-gray-600 border-gray-300 hover:bg-gray-100 w-8 h-8 p-0"
                        }
                        onClick={() => handlePageChange(pageNum)}
                      >
                        {pageNum}
                      </Button>
                    );
                  }
                )}
              </div>

              <Button
                size="sm"
                variant="outline"
                disabled={pagination.currentPage === pagination.totalPages}
                onClick={() => handlePageChange(pagination.currentPage + 1)}
                className="text-gray-600 border-gray-300 hover:bg-gray-100"
              >
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
