"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import {
  Search,
  FileText,
  User,
  Eye,
  CheckCircle,
  Clock,
  Download,
  Trash2,
  Loader2,
  MoreHorizontal,
  X,
  ClipboardList,
} from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { toast } from "@/components/ui/use-toast";
import { AddAssessmentDialog } from "@/components/assessment/add-assessment-form";
import { UserRole } from "@/lib/generated/userRoles";
import { PrescriptionDetailsView } from "@/components/prescription/PrescriptionDetailsView";

const CACHE_LIMIT = 100;

interface Prescription {
  id: string;
  patientId: string;
  patientName: string;
  prescribedBy: string;
  prescriptionDate: string;
  createdAt: string;
  updatedAt: string;
  therapist: { user: { name: string } };
  patient: { id: string; patientName: string };
  session?: { completed: boolean; sessionDate: string };
}

export function PrescriptionManagementSection() {
  const { user } = useAuth();

  const [cachedPrescriptions, setCachedPrescriptions] = useState<
    Prescription[]
  >([]);
  const [totalServerCount, setTotalServerCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const [selectedPrescriptionId, setSelectedPrescriptionId] = useState<
    string | null
  >(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [prescriptionToDelete, setPrescriptionToDelete] =
    useState<Prescription | null>(null);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Reset to page 1 on search or page size change
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, pageSize]);

  // Slice cache for current page
  const prescriptions = useMemo(() => {
    const start = (page - 1) * pageSize;
    return cachedPrescriptions.slice(start, start + pageSize);
  }, [cachedPrescriptions, page, pageSize]);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(totalServerCount / pageSize)),
    [totalServerCount, pageSize],
  );

  const fetchPrescriptions = useCallback(
    async (serverPage = 1, search = debouncedSearch, append = false) => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          currentPage: String(serverPage),
          limit: String(CACHE_LIMIT),
          ...(search ? { search } : {}),
          ...(user?.role === UserRole.THERAPIST && user.id
            ? { therapistId: user.id }
            : {}),
        });

        const response = await fetch(`/api/prescriptions?${params}`);
        if (!response.ok) throw new Error("Failed to fetch prescriptions");

        const data = await response.json();
        if (data.success) {
          const transformed: Prescription[] = data.prescriptions.map(
            (p: Prescription) => ({
              id: p.id,
              patientId: p.patient?.id || "N/A",
              patientName: p.patient?.patientName || "No Patient",
              prescribedBy: p.therapist.user.name,
              prescriptionDate: p.createdAt || "Not specified",
              createdAt: p.createdAt,
              updatedAt: p.updatedAt,
              therapist: p.therapist,
              patient: p.patient,
              session: p.session,
            }),
          );
          setCachedPrescriptions((prev) =>
            append ? [...prev, ...transformed] : transformed,
          );
          setTotalServerCount(
            data.pagination?.totalCount ?? data.prescriptions.length,
          );
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
    },
    [debouncedSearch, user],
  );

  // Re-fetch when search changes
  useEffect(() => {
    fetchPrescriptions(1, debouncedSearch, false);
  }, [debouncedSearch]);

  // Append next batch when user pages beyond cache
  useEffect(() => {
    const cachedEnd = cachedPrescriptions.length;
    const neededEnd = page * pageSize;
    if (neededEnd > cachedEnd && cachedEnd < totalServerCount) {
      const serverPage = Math.floor(cachedEnd / CACHE_LIMIT) + 1;
      fetchPrescriptions(serverPage, debouncedSearch, true);
    }
  }, [page, pageSize]);

  const handleViewDetails = (prescriptionId: string) => {
    setSelectedPrescriptionId(prescriptionId);
    setDetailsOpen(true);
  };

  const handleDownloadPDF = async (
    prescriptionId: string,
    patientName: string,
  ) => {
    try {
      setDownloadingId(prescriptionId);
      const response = await fetch(`/api/prescriptions/${prescriptionId}/pdf`);
      if (!response.ok) throw new Error("Failed to generate PDF");
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${patientName.replace(/\s+/g, "_")}_Assessment_${prescriptionId.slice(0, 8)}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      toast({ title: "Success", description: "PDF downloaded successfully" });
    } catch {
      toast({
        title: "Error",
        description: "Failed to download PDF. Please try again.",
        variant: "destructive",
      });
    } finally {
      setDownloadingId(null);
    }
  };

  const handleDeletePrescription = (prescription: Prescription) => {
    setPrescriptionToDelete(prescription);
    setDeleteDialogOpen(true);
  };

  const confirmDeletePrescription = async () => {
    if (!prescriptionToDelete) return;
    try {
      setDeletingId(prescriptionToDelete.id);
      const response = await fetch(
        `/api/prescriptions/${prescriptionToDelete.id}`,
        { method: "DELETE" },
      );
      if (!response.ok) throw new Error("Failed to delete prescription");

      const data = await response.json();
      if (data.success) {
        toast({
          title: "Success",
          description: "Assessment deleted successfully",
        });
        setCachedPrescriptions((prev) =>
          prev.filter((p) => p.id !== prescriptionToDelete.id),
        );
        setTotalServerCount((prev) => prev - 1);
        setDeleteDialogOpen(false);
        setPrescriptionToDelete(null);
      } else {
        throw new Error(data.error || "Failed to delete prescription");
      }
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to delete assessment.",
        variant: "destructive",
      });
    } finally {
      setDeletingId(null);
    }
  };

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

  const formatTime = (dateString: string) =>
    new Date(dateString).toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });

  // Stats computed from full cache
  const completedCount = useMemo(
    () => cachedPrescriptions.filter((p) => p.session?.completed).length,
    [cachedPrescriptions],
  );
  const inProgressCount = useMemo(
    () => cachedPrescriptions.filter((p) => !p.session?.completed).length,
    [cachedPrescriptions],
  );
  const todayCount = useMemo(
    () =>
      cachedPrescriptions.filter(
        (p) =>
          new Date(p.createdAt).toDateString() === new Date().toDateString(),
      ).length,
    [cachedPrescriptions],
  );

  const columns: DataTableColumn<Prescription>[] = [
    {
      header: "#",
      headerClassName: "w-14 text-center",
      cellClassName: "text-center text-sm text-gray-400 font-medium",
      cell: (_, index) => (page - 1) * pageSize + index + 1,
    },
    {
      header: "Patient Name",
      cell: (p) => (
        <div className="font-semibold text-gray-800">{p.patientName}</div>
      ),
    },
    {
      header: "Patient ID",
      cell: (p) => (
        <Badge className="bg-indigo-50 text-indigo-700 font-mono text-xs border-0 hover:bg-indigo-50">
          {p.patientId}
        </Badge>
      ),
    },
    {
      header: "Assessment Date",
      cell: (p) => (
        <>
          <div className="font-medium text-gray-800">
            {formatDate(p.prescriptionDate)}
          </div>
          <div className="text-xs text-gray-400 mt-0.5">
            {formatTime(p.prescriptionDate)}
          </div>
        </>
      ),
    },
    {
      header: "Therapist",
      cellClassName: "text-gray-700",
      cell: (p) => p.prescribedBy,
    },
    {
      header: "Actions",
      headerClassName: "text-right pr-6",
      cellClassName: "text-right pr-4",
      cell: (p) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                handleViewDetails(p.id);
              }}
            >
              <Eye className="mr-2 h-4 w-4" />
              View Details
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                handleDownloadPDF(p.id, p.patientName);
              }}
              disabled={downloadingId === p.id}
            >
              {downloadingId === p.id ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Download className="mr-2 h-4 w-4" />
              )}
              Download PDF
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-red-600 focus:text-red-600"
              onClick={(e) => {
                e.stopPropagation();
                handleDeletePrescription(p);
              }}
              disabled={deletingId === p.id}
            >
              {deletingId === p.id ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="mr-2 h-4 w-4" />
              )}
              Delete Record
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <div className="bg-indigo-50/30 rounded-xl p-6 mb-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">
            Assessment Records
          </h2>
          <p className="text-sm text-gray-500 mt-0.5">
            {totalServerCount > 0
              ? `${totalServerCount} total records`
              : "Manage and view patient assessment records"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {user?.role === UserRole.THERAPIST && (
            <AddAssessmentDialog
              onAssessmentAdded={() =>
                fetchPrescriptions(1, debouncedSearch, false)
              }
            />
          )}
        </div>
      </div>

      {/* Stats Cards */}
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
                  {totalServerCount}
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
                  {completedCount}
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
                  {inProgressCount}
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
                <p className="text-lg font-bold text-gray-900">{todayCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search bar */}
      <div className="flex justify-end mb-4">
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
          <Input
            placeholder="Search by patient name, ID, or therapist..."
            className="bg-white pl-9 pr-8 w-72 border-gray-200 focus:border-indigo-400 rounded-lg shadow-sm text-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500 transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={prescriptions}
        rowKey={(p) => p.id}
        page={page}
        pageSize={pageSize}
        totalPages={totalPages}
        totalCount={totalServerCount}
        setPage={setPage}
        setPageSize={setPageSize}
        loading={loading}
        countIcon={<ClipboardList className="h-5 w-5" />}
        countLabel="records"
        emptyIcon={<FileText className="h-10 w-10" />}
        emptyTitle="No assessment records found"
        emptyDescription={
          searchQuery
            ? `No results for "${searchQuery}"`
            : "Create your first assessment record to get started"
        }
        onRowClick={(p) => handleViewDetails(p.id)}
      />

      {/* View Details Dialog */}
      <Dialog
        open={detailsOpen}
        onOpenChange={(open) => {
          setDetailsOpen(open);
          if (!open) setSelectedPrescriptionId(null);
        }}
      >
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              assessment for patient{" "}
              <span className="font-semibold text-gray-900">
                {prescriptionToDelete?.patientName}
              </span>{" "}
              and all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setDeleteDialogOpen(false);
                setPrescriptionToDelete(null);
              }}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeletePrescription}
              className="bg-red-600 hover:bg-red-700"
              disabled={deletingId !== null}
            >
              {deletingId ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Assessment"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
