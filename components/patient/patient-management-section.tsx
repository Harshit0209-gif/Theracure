"use client";

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
import {
  Search,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  Eye,
  Edit,
  Trash,
  MoreHorizontal,
  MoreHorizontalIcon,
} from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { AddPatientDialog } from "./add-patient-dialog";
import { toast } from "@/components/ui/use-toast";
import { UserRole } from "@/lib/generated/userRoles";
import { Patient } from "@/types/patient";
import { PaginationDefaultValue, PaginationInfo } from "@/types";
import { PatientDetailsCard } from "./patientDetailsCard";
import { EditPatientDialog } from "./editPatientDetails";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@radix-ui/react-dropdown-menu";

interface ApiResponse {
  success: boolean;
  patients: Patient[];
  pagination: PaginationInfo;
}

// Main Patient Management Component
export function PatientManagementSection() {
  const { user } = useAuth();
  const isTherapist = user?.role === UserRole.THERAPIST;

  const [searchQuery, setSearchQuery] = useState("");
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<PaginationInfo>(
    PaginationDefaultValue
  );
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [editPatient, setEditPatient] = useState<Patient | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [deletingPatient, setDeletingPatient] = useState<string | null>(null);

  // Fetch patients from API
  const fetchPatients = async (
    currentPage: number = 1,
    search: string = ""
  ) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        currentPage: currentPage.toString(),
        limit: pagination.limit.toString(),
        ...(user?.role === UserRole.THERAPIST && { therapistId: user.id }),
        ...(search && { search }),
      });

      const response = await fetch(`/api/patients?${params}`);

      if (!response.ok) {
        throw new Error("Failed to fetch patients");
      }

      const data: ApiResponse = await response.json();

      if (data.success) {
        setPatients(data.patients);
        setPagination(data.pagination);
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
  };

  // Initial load
  useEffect(() => {
    fetchPatients();
  }, []);

  // Handle search with debounce
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchPatients(1, searchQuery);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const handlePageChange = (newPage: number) => {
    setPagination((prev) => ({ ...prev, currentPage: newPage }));
    fetchPatients(newPage, searchQuery);
  };

  // Handle patient details view
  const handleViewDetails = (patient: Patient) => {
    setSelectedPatient(patient);
    setDetailsOpen(true);
  };

  // Handle edit patient
  const handleEditPatient = (patient: Patient) => {
    setEditPatient(patient);
    setEditOpen(true);
    setDetailsOpen(false);
  };

  // Handle patient update
  const handlePatientUpdate = (updatedPatient: Patient) => {
    setPatients((prev) =>
      prev.map((p) => (p.id === updatedPatient.id ? updatedPatient : p))
    );
    setSelectedPatient(updatedPatient);
    fetchPatients(pagination.currentPage, searchQuery);
  };

  // Handle patient delete
  const handleDeletePatient = async (patient: Patient) => {
    try {
      setDeletingPatient(patient.id);
      const response = await fetch(`/api/patients/${patient.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete patient");
      }

      // Remove from local state
      setPatients((prev) => prev.filter((p) => p.id !== patient.id));

      // Close details dialog if the deleted patient was being viewed
      if (selectedPatient?.id === patient.id) {
        setDetailsOpen(false);
        setSelectedPatient(null);
      }

      toast({
        title: "Success",
        description: "Patient deleted successfully.",
      });

      // Refresh the patient list
      fetchPatients(pagination.currentPage, searchQuery);
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

  return (
    <div className="bg-gray-200 rounded-lg p-6 mb-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-800">
          Patient Management
        </h2>
        <div className="flex gap-2">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-indigo-400 h-4 w-4" />
            <Input
              placeholder="Search by name, email, phone, or ID"
              className="bg-white pl-10 border border-indigo-300 rounded-lg text-sm placeholder:text-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          {!isTherapist && <AddPatientDialog fetchPatients={fetchPatients} />}
        </div>
      </div>

      <div className="bg-white rounded-b-lg">
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
              <TableHead className="font-semibold text-white">Age</TableHead>
              <TableHead className="font-semibold text-white">Gender</TableHead>
              <TableHead className="font-semibold text-white">Phone</TableHead>
              <TableHead className="font-semibold text-white">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
                    <span className="ml-2 text-gray-600">
                      Loading patients...
                    </span>
                  </div>
                </TableCell>
              </TableRow>
            ) : patients.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="text-center py-8 text-gray-500"
                >
                  {searchQuery
                    ? "No patients found matching your search."
                    : "No patients found."}
                </TableCell>
              </TableRow>
            ) : (
              patients.map((patient, index) => (
                <TableRow key={patient.id} className="hover:bg-gray-50">
                  <TableCell>
                    {(pagination.currentPage - 1) * pagination.limit +
                      index +
                      1}
                  </TableCell>
                  <TableCell className="font-medium">
                    {patient.patientName}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className="bg-indigo-100 text-indigo-800"
                    >
                      {patient.id}
                    </Badge>
                  </TableCell>
                  <TableCell>{patient.age}</TableCell>
                  <TableCell className="capitalize">{patient.gender}</TableCell>
                  <TableCell>{patient.phone || "N/A"}</TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50 transition-all duration-200 rounded-md"
                        onClick={() => handleViewDetails(patient)}
                      >
                        <Eye className="h-4 w-4" />
                        <span className="sr-only">View patient details</span>
                      </Button>

                      {!isTherapist && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-amber-600 hover:text-amber-700 hover:bg-amber-50 transition-all duration-200 rounded-md"
                            onClick={() => handleEditPatient(patient)}
                          >
                            <Edit className="h-4 w-4" />
                            <span className="sr-only">Edit patient</span>
                          </Button>

                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 transition-all duration-200 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                                disabled={deletingPatient === patient.id}
                              >
                                {deletingPatient === patient.id ? (
                                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-red-300 border-t-red-600" />
                                ) : (
                                  <Trash className="h-4 w-4" />
                                )}
                                <span className="sr-only">Delete patient</span>
                              </Button>
                            </AlertDialogTrigger>

                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  Are you absolutely sure?
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  This action cannot be undone. This will
                                  permanently delete the patient
                                  <span className="font-medium">
                                    {" "}
                                    {patient.patientName}
                                  </span>{" "}
                                  and all associated data.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeletePatient(patient)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Delete Patient
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {/* Pagination Controls */}
        {!loading && patients.length > 0 && (
          <div className="flex justify-between items-center p-4 bg-white border-t">
            <span className="text-sm text-gray-700">
              Showing {(pagination.currentPage - 1) * pagination.limit + 1} to{" "}
              {Math.min(
                pagination.currentPage * pagination.limit,
                pagination.totalCount
              )}{" "}
              of {pagination.totalCount} patients
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
