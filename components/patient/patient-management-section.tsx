"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { Search, Eye, Edit, Trash, X, Users, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { AddPatientDialog } from "./add-patient-dialog";
import { toast } from "@/components/ui/use-toast";
import { UserRole } from "@/lib/generated/userRoles";
import { Patient } from "@/types/patient";
import { PatientDetailsCard } from "./patientDetailsCard";
import { EditPatientDialog } from "./editPatientDetails";

const CACHE_LIMIT = 100;

export function PatientManagementSection() {
  const { user } = useAuth();
  const isTherapist = user?.role === UserRole.THERAPIST;

  const [cachedPatients, setCachedPatients] = useState<Patient[]>([]);
  const [totalServerCount, setTotalServerCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [deletingPatient, setDeletingPatient] = useState<string | null>(null);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [editPatient, setEditPatient] = useState<Patient | null>(null);
  const [editOpen, setEditOpen] = useState(false);

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
  const patients = useMemo(() => {
    const start = (page - 1) * pageSize;
    return cachedPatients.slice(start, start + pageSize);
  }, [cachedPatients, page, pageSize]);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(totalServerCount / pageSize)),
    [totalServerCount, pageSize],
  );

  const fetchPatients = useCallback(
    async (serverPage = 1, search = debouncedSearch, append = false) => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          currentPage: String(serverPage),
          limit: String(CACHE_LIMIT),
          ...(user?.role === UserRole.THERAPIST && user.id
            ? { therapistId: user.id }
            : {}),
          ...(search ? { search } : {}),
        });

        const response = await fetch(`/api/patients?${params}`);
        if (!response.ok) throw new Error("Failed to fetch patients");

        const data = await response.json();
        if (data.success) {
          setCachedPatients((prev) =>
            append ? [...prev, ...data.patients] : data.patients,
          );
          setTotalServerCount(
            data.pagination?.totalCount ?? data.patients.length,
          );
        } else {
          throw new Error("API returned error");
        }
      } catch (error) {
        console.error("Error fetching patients:", error);
        toast({
          title: "Error",
          description: "Failed to fetch patients. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    },
    [debouncedSearch, user],
  );

  // Re-fetch (replace cache) when search changes
  useEffect(() => {
    fetchPatients(1, debouncedSearch, false);
  }, [debouncedSearch]);

  // Append next batch when user pages beyond cached records
  useEffect(() => {
    const cachedEnd = cachedPatients.length;
    const neededEnd = page * pageSize;
    if (neededEnd > cachedEnd && cachedEnd < totalServerCount) {
      const serverPage = Math.floor(cachedEnd / CACHE_LIMIT) + 1;
      fetchPatients(serverPage, debouncedSearch, true);
    }
  }, [page, pageSize]);

  const handleViewDetails = (patient: Patient) => {
    setSelectedPatient(patient);
    setDetailsOpen(true);
  };

  const handleEditPatient = (patient: Patient) => {
    setEditPatient(patient);
    setEditOpen(true);
    setDetailsOpen(false);
  };

  const handlePatientUpdate = (updatedPatient: Patient) => {
    setCachedPatients((prev) =>
      prev.map((p) => (p.id === updatedPatient.id ? updatedPatient : p)),
    );
    setSelectedPatient(updatedPatient);
  };

  const handleDeletePatient = async (patient: Patient) => {
    try {
      setDeletingPatient(patient.id);
      const response = await fetch(`/api/patients/${patient.id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete patient");

      setCachedPatients((prev) => prev.filter((p) => p.id !== patient.id));
      setTotalServerCount((prev) => prev - 1);
      if (selectedPatient?.id === patient.id) {
        setDetailsOpen(false);
        setSelectedPatient(null);
      }
      toast({ title: "Success", description: "Patient deleted successfully." });
    } catch (error) {
      console.error("Error deleting patient:", error);
      toast({
        title: "Error",
        description: "Failed to delete patient. Please try again.",
        variant: "destructive",
      });
    } finally {
      setDeletingPatient(null);
    }
  };

  const patientColumns: DataTableColumn<Patient>[] = [
    {
      header: "#",
      headerClassName: "w-16 text-center",
      cellClassName: "text-center text-sm text-gray-400 font-medium",
      cell: (_, index) => (page - 1) * pageSize + index + 1,
    },
    {
      header: "Patient Name",
      cell: (patient) => (
        <>
          <div className="font-semibold text-gray-800">
            {patient.patientName}
          </div>
          {patient.email && (
            <div className="text-xs text-gray-400 mt-0.5">{patient.email}</div>
          )}
        </>
      ),
    },
    {
      header: "Patient ID",
      cell: (patient) => (
        <Badge className="bg-indigo-50 text-indigo-700 border border-indigo-100 font-mono text-xs hover:bg-indigo-50">
          {patient.id}
        </Badge>
      ),
    },
    {
      header: "Age",
      headerClassName: "w-16",
      cellClassName: "text-gray-600",
      cell: (patient) => patient.age,
    },
    {
      header: "Gender",
      headerClassName: "w-24",
      cell: (patient) => (
        <Badge
          className={
            patient.gender?.toLowerCase() === "male"
              ? "bg-blue-50 text-blue-700 hover:bg-blue-50 border-0"
              : patient.gender?.toLowerCase() === "female"
                ? "bg-pink-50 text-pink-700 hover:bg-pink-50 border-0"
                : "bg-gray-50 text-gray-600 hover:bg-gray-50 border-0"
          }
        >
          {patient.gender
            ? patient.gender.charAt(0).toUpperCase() +
              patient.gender.slice(1).toLowerCase()
            : "—"}
        </Badge>
      ),
    },
    {
      header: "Phone",
      cellClassName: "text-gray-600 text-sm",
      cell: (patient) =>
        patient.phone || <span className="text-gray-300">—</span>,
    },
    {
      header: "Actions",
      headerClassName: "text-right pr-6",
      cellClassName: "text-right pr-4",
      cell: (patient) => (
        <div className="flex items-center justify-end gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg"
            onClick={(e) => {
              e.stopPropagation();
              handleViewDetails(patient);
            }}
            title="View details"
          >
            <Eye className="h-4 w-4" />
          </Button>

          {!isTherapist && (
            <>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-amber-500 hover:text-amber-700 hover:bg-amber-50 rounded-lg"
                onClick={(e) => {
                  e.stopPropagation();
                  handleEditPatient(patient);
                }}
                title="Edit patient"
              >
                <Edit className="h-4 w-4" />
              </Button>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg"
                    disabled={deletingPatient === patient.id}
                    onClick={(e) => e.stopPropagation()}
                    title="Delete patient"
                  >
                    {deletingPatient === patient.id ? (
                      <Loader2 className="h-4 w-4 animate-spin text-red-400" />
                    ) : (
                      <Trash className="h-4 w-4" />
                    )}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete patient?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete{" "}
                      <span className="font-semibold text-gray-800">
                        {patient.patientName}
                      </span>{" "}
                      and all associated data. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => handleDeletePatient(patient)}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="bg-indigo-50/30 rounded-xl p-6 mb-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">
            Patient Management
          </h2>
        </div>
        {!isTherapist && (
          <AddPatientDialog
            fetchPatients={() => fetchPatients(1, debouncedSearch, false)}
          />
        )}
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-center bg-white border border-b-0 border-gray-200 rounded-t-xl px-4 py-1.5 shadow-sm">
        <div className="relative group w-80 focus-within:w-[480px] transition-all duration-300">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 group-focus-within:text-indigo-500 transition-colors pointer-events-none" />
          <Input
            placeholder="Search name, ID, phone, email..."
            className="h-[36px] bg-white pl-9 pr-8 w-full border-gray-300 focus:border-indigo-400 rounded-md shadow-sm text-sm"
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

      <DataTable
        columns={patientColumns}
        data={patients}
        rowKey={(p) => p.id}
        page={page}
        pageSize={pageSize}
        totalPages={totalPages}
        totalCount={totalServerCount}
        setPage={setPage}
        setPageSize={setPageSize}
        loading={loading}
        countIcon={<Users className="h-5 w-5" />}
        countLabel="patients"
        emptyIcon={<Users className="h-10 w-10" />}
        emptyTitle="No patients found"
        emptyDescription={
          searchQuery
            ? `No results for "${searchQuery}"`
            : "Add your first patient to get started"
        }
        className="rounded-t-none border-t-0"
      />

      {/* Patient Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="sr-only">Patient Details</DialogTitle>
          </DialogHeader>
          {selectedPatient && (
            <PatientDetailsCard
              patient={selectedPatient}
              onEdit={handleEditPatient}
              onDelete={handleDeletePatient}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Patient Dialog */}
      <EditPatientDialog
        patient={editPatient}
        open={editOpen}
        onOpenChange={setEditOpen}
        onSave={handlePatientUpdate}
      />
    </div>
  );
}
