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
  ChevronLeft,
  ChevronRight,
  Calendar,
  Loader2,
  Trash2,
  User,
  RefreshCw,
} from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { useApiFetch } from "@/hooks/use-api-fetch";
import { usePrescriptionActions } from "@/hooks/use-prescription-actions";
import { PrescriptionDetailsDialog } from "./prescription-details-dialog";

interface Prescription {
  id: string;
  patientId: string;
  therapistId: string;
  sessionId: string;
  createdAt: string;
  updatedAt: string;
  patient: {
    id: string;
    patientName: string;
  };
  therapist: {
    id: string;
    user: {
      name: string;
      email: string;
    };
  };
  session: {
    id: string;
    sessionDate: string;
    completed: boolean;
  };
}

interface PrescriptionTableViewProps {
  patientId: string;
  refreshTrigger?: number;
}

export function PrescriptionTableView({
  patientId,
  refreshTrigger = 0,
}: PrescriptionTableViewProps) {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [isReloading, setIsReloading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedPrescriptionId, setSelectedPrescriptionId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const pageSize = 10;
  const { apiFetch } = useApiFetch();
  const { handleView, handleDownload } = usePrescriptionActions();

  // Fetch prescriptions
  const fetchPrescriptions = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: pageSize.toString(),
        patientId: patientId,
        ...(searchQuery && { search: searchQuery }),
      });

      console.log("Fetching prescriptions with params:", {
        page: currentPage,
        limit: pageSize,
        patientId,
        searchQuery,
      });

      const response = await apiFetch(`/api/prescriptions?${params}`);

      console.log("Prescription API response:", response);

      // useApiFetch wraps the response in response.data
      if (response.success && response.data) {
        const apiData = response.data as any;
        if (apiData.prescriptions) {
          console.log("Prescriptions found:", apiData.prescriptions.length);
          setPrescriptions(apiData.prescriptions);
          setTotalPages(apiData.pagination.totalPages);
          setTotalCount(apiData.pagination.totalCount);
        } else {
          console.log("No prescriptions in response data");
          setPrescriptions([]);
          setTotalPages(1);
          setTotalCount(0);
        }
      } else {
        console.error("Failed to fetch prescriptions:", response.error);
        setPrescriptions([]);
        setTotalPages(1);
        setTotalCount(0);
      }
    } catch (error) {
      console.error("Error fetching prescriptions:", error);
      setPrescriptions([]);
      setTotalPages(1);
      setTotalCount(0);
      toast({
        title: "Error",
        description: "Failed to load prescriptions",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Initial load and refresh on trigger change
  useEffect(() => {
    fetchPrescriptions();
  }, [patientId, currentPage, refreshTrigger]);

  // Search with debounce
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setCurrentPage(1);
      fetchPrescriptions();
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const handleViewDetails = (prescriptionId: string) => {
    setSelectedPrescriptionId(prescriptionId);
    setDialogOpen(true);
  };

  const handleDelete = async (prescriptionId: string) => {
    try {
      const response = await apiFetch(`/api/prescriptions/${prescriptionId}`, {
        method: "DELETE",
      });

      if (response.success) {
        toast({
          title: "Success",
          description: "Prescription deleted successfully",
        });
        fetchPrescriptions();
      }
    } catch (error) {
      console.error("Delete error:", error);
      toast({
        title: "Error",
        description: "Failed to delete prescription",
        variant: "destructive",
      });
    }
  };

  const handleReload = async () => {
    try {
      setIsReloading(true);
      await fetchPrescriptions();
      toast({
        title: "Reloaded",
        description: "Prescriptions refreshed successfully",
      });
    } catch (error) {
      console.error("Reload error:", error);
      toast({
        title: "Error",
        description: "Failed to reload prescriptions",
        variant: "destructive",
      });
    } finally {
      setIsReloading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="space-y-4">
      {/* Search Control */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search prescriptions..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Button
          variant="outline"
          size="default"
          onClick={handleReload}
          disabled={isReloading || loading}
          className="whitespace-nowrap"
        >
          <RefreshCw
            className={`h-4 w-4 mr-2 ${isReloading ? "animate-spin" : ""}`}
          />
          Reload
        </Button>
      </div>

      {/* Prescription Table */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead className="font-semibold w-1/3">Therapist</TableHead>
              <TableHead className="font-semibold w-1/4">Session Date</TableHead>
              <TableHead className="font-semibold w-1/4">Created Date</TableHead>
              <TableHead className="font-semibold text-center w-[120px]">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8">
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-gray-600">
                      Loading prescriptions...
                    </span>
                  </div>
                </TableCell>
              </TableRow>
            ) : prescriptions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8">
                  <div className="space-y-2">
                    <FileText className="h-8 w-8 text-gray-400 mx-auto" />
                    <p className="text-gray-500">
                      {searchQuery
                        ? "No prescriptions found matching your search"
                        : "No prescriptions found for this patient"}
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              prescriptions.map((prescription) => (
                <TableRow key={prescription.id} className="hover:bg-gray-50">
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-gray-400" />
                      <span className="text-sm font-medium text-gray-900">
                        {prescription.therapist.user.name}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatDate(prescription.session.sessionDate)}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatDate(prescription.createdAt)}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 mx-auto"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => handleViewDetails(prescription.id)}
                          className="flex items-center gap-2"
                        >
                          <Eye className="h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleView(prescription.id)}
                          className="flex items-center gap-2"
                        >
                          <Download className="h-4 w-4" />
                          Download PDF
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-red-600 flex items-center gap-2"
                          onClick={() => handleDelete(prescription.id)}
                        >
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
      {!loading && prescriptions.length > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <p className="text-sm text-gray-700">
            Showing {(currentPage - 1) * pageSize + 1} to{" "}
            {Math.min(currentPage * pageSize, totalCount)} of {totalCount}{" "}
            prescriptions
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
      {!loading && prescriptions.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t">
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">{totalCount}</p>
            <p className="text-sm text-gray-600">Total Prescriptions</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600">
              {prescriptions.filter((p) => p.session.completed === true).length}
            </p>
            <p className="text-sm text-gray-600">Completed Sessions</p>
          </div>
        </div>
      )}

      {/* Prescription Details Dialog */}
      <PrescriptionDetailsDialog
        prescriptionId={selectedPrescriptionId}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </div>
  );
}
