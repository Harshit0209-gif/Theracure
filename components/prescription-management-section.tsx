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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  Calendar,
  Plus,
} from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { toast } from "@/hooks/use-toast";
import { AddAssessmentDialog } from "./add-prescription-form";

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
}

interface PaginationInfo {
  totalCount: number;
  totalPages: number;
  currentPage: number;
  limit: number;
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
  const [pagination, setPagination] = useState<PaginationInfo>({
    totalCount: 0,
    totalPages: 0,
    currentPage: 1,
    limit: 5,
  });
  const [selectedPrescription, setSelectedPrescription] =
    useState<Prescription | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  // Fetch prescriptions from API
  const fetchPrescriptions = async (page: number = 1, search: string = "") => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString(),
        ...(search && { search }),
        ...(user?.role === "therapist" && { therapistId: user.id }),
      });

      const response = await fetch(`/api/prescriptions?${params}`);

      if (!response.ok) {
        throw new Error("Failed to fetch prescriptions");
      }

      const data: ApiResponse = await response.json();
      console.log("API response data:", data.prescriptions);

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
      console.log("Fetched prescriptions:", prescriptions);
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

  // Handle page change
  const handlePageChange = (newPage: number) => {
    fetchPrescriptions(newPage, searchQuery);
  };

  // Handle prescription details view
  const handleViewDetails = (prescription: Prescription) => {
    setSelectedPrescription(prescription);
    setDetailsOpen(true);
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Prescription Details Card Component
  const PrescriptionDetailsCard = ({
    prescription,
  }: {
    prescription: Prescription;
  }) => (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-xl">
          <FileText className="h-5 w-5 text-indigo-600" />
          Prescription Details
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Basic Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-600">
              Prescription ID
            </label>
            <div className="flex items-center gap-2">
              <Badge
                variant="secondary"
                className="bg-indigo-100 text-indigo-800"
              >
                {prescription.id}
              </Badge>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-600">
              Patient Name
            </label>
            <p className="text-lg font-semibold text-gray-900">
              {prescription.patientName}
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-600">
              Patient ID
            </label>
            <p className="text-gray-900">{prescription.patientId}</p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-600">
              Prescribed By
            </label>
            <p className="text-gray-900">{prescription.prescribedBy}</p>
          </div>
        </div>

        {/* Timestamps */}
        <div className="border-t pt-4">
          <h4 className="font-medium text-gray-900 mb-3">Prescription Info</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>
                Prescribed: {formatDate(prescription.prescriptionDate)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>Created: {formatDate(prescription.createdAt)}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="bg-gray-200 rounded-lg p-6 mb-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-800">
          Prescription Management System
        </h2>
        <div className="flex gap-2">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-indigo-400 h-4 w-4" />
            <Input
              placeholder="Search by patient name, ID, or medicine"
              className="bg-white pl-10 border border-indigo-300 rounded-lg text-sm placeholder:text-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <AddAssessmentDialog onAssessmentAdded={() => fetchPrescriptions()} />
        </div>
      </div>

      <div className="bg-white rounded-b-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-indigo-700">
              <TableHead className="font-semibold text-white">Sl. No</TableHead>
              <TableHead className="font-semibold text-white">
                Patient Name
              </TableHead>
              <TableHead className="font-semibold text-white">
                Patient ID
              </TableHead>
              <TableHead className="font-semibold text-white">
                Prescribed By
              </TableHead>
              <TableHead className="font-semibold text-white">Date</TableHead>
              <TableHead className="font-semibold text-white">
                Details
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
                    <span className="ml-2 text-gray-600">
                      Loading prescriptions...
                    </span>
                  </div>
                </TableCell>
              </TableRow>
            ) : prescriptions.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center py-8 text-gray-500"
                >
                  {searchQuery
                    ? "No prescriptions found matching your search."
                    : "No prescriptions found."}
                </TableCell>
              </TableRow>
            ) : (
              prescriptions.map((prescription, index) => (
                <TableRow key={prescription.id} className="hover:bg-gray-50">
                  <TableCell>
                    {(pagination.currentPage - 1) * pagination.limit +
                      index +
                      1}
                  </TableCell>
                  <TableCell className="font-medium">
                    {prescription.patientName}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className="bg-indigo-100 text-indigo-800"
                    >
                      {prescription.patientId}
                    </Badge>
                  </TableCell>
                  <TableCell>{prescription.prescribedBy}</TableCell>
                  <TableCell>
                    {formatDate(prescription.prescriptionDate)}
                  </TableCell>
                  <TableCell>
                    <Dialog
                      open={
                        detailsOpen &&
                        selectedPrescription?.id === prescription.id
                      }
                      onOpenChange={setDetailsOpen}
                    >
                      <DialogTrigger asChild>
                        <Button
                          variant="link"
                          className="text-indigo-700 hover:text-indigo-900 p-0"
                          onClick={() => handleViewDetails(prescription)}
                        >
                          View Details
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle className="sr-only">
                            Prescription Details
                          </DialogTitle>
                        </DialogHeader>
                        {selectedPrescription && (
                          <PrescriptionDetailsCard
                            prescription={selectedPrescription}
                          />
                        )}
                      </DialogContent>
                    </Dialog>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {/* Pagination Controls */}
        {!loading && prescriptions.length > 0 && (
          <div className="flex justify-between items-center p-4 bg-white border-t">
            <span className="text-sm text-gray-700">
              Showing {(pagination.currentPage - 1) * pagination.limit + 1} to{" "}
              {Math.min(
                pagination.totalPages * pagination.limit,
                pagination.totalPages
              )}{" "}
              of {pagination.totalCount} prescriptions
            </span>
            <div className="flex items-center space-x-2">
              <Button
                size="sm"
                variant="outline"
                className="border-indigo-600 text-indigo-700 hover:bg-indigo-50"
                disabled={pagination.currentPage === 1}
                onClick={() => handlePageChange(pagination.currentPage - 1)}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>

              {/* Page Numbers */}
              <div className="flex items-center space-x-1">
                {Array.from(
                  { length: pagination.totalPages },
                  (_, i) => i + 1
                ).map((pg) => (
                  <Button
                    key={pg}
                    size="sm"
                    variant={
                      pg === pagination.currentPage ? "default" : "outline"
                    }
                    className={
                      pg === pagination.currentPage
                        ? "bg-indigo-600 text-white hover:bg-indigo-700 border-indigo-600 w-8 h-8 p-0"
                        : "text-indigo-700 hover:bg-indigo-50 w-8 h-8 p-0"
                    }
                    onClick={() => handlePageChange(pg)}
                  >
                    {pg}
                  </Button>
                ))}
              </div>

              <Button
                size="sm"
                variant="outline"
                className="border-indigo-600 text-indigo-700 hover:bg-indigo-50"
                disabled={pagination.currentPage === pagination.totalPages}
                onClick={() => handlePageChange(pagination.currentPage + 1)}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
