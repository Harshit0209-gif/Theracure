"use client";

import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import {
  Search,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Edit,
  Clock,
  X,
  CheckCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

interface Consultation {
  id: string;
  name: string;
  email: string;
  consultationWith: string;
  consultationDate: string;
  consultationTime: string;
  status: "NOT_ASSIGN" | "ASSIGNED" | "COMPLETED" | "CANCELLED";
  createdAt: Date;
  updatedAt: Date;
}

const statusColor: Record<string, string> = {
  NOT_ASSIGN: "bg-red-100 text-red-700 border-red-200",
  ASSIGNED: "bg-green-100 text-green-700 border-green-200",
  COMPLETED: "bg-indigo-100 text-indigo-700 border-indigo-200",
  CANCELLED: "bg-gray-100 text-gray-700 border-gray-200",
};

const statusLabels: Record<string, string> = {
  NOT_ASSIGN: "Not Assigned",
  ASSIGNED: "Assigned",
  COMPLETED: "Done",
  CANCELLED: "Cancelled",
};

const availableDoctors = [
  { value: "Dr. Mainak Sur (PT)", label: "Dr. Mainak Sur (PT)" },
  { value: "Dr. Diksha Palit (PT)", label: "Dr. Diksha Palit (PT)" },
  { value: "Dr. Diptesh Dey (PT)", label: "Dr. Diptesh Dey (PT)" },
];

const updateConsultation = async (id: string, consultationWith: string) => {
  try {
    const response = await fetch(`/api/consultations/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        consultationWith: consultationWith,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to update consultation");
    }

    return data;
  } catch (error) {
    console.error("Error updating consultation:", error);
    throw error;
  }
};

const fetchConsultations = async (filters = {}) => {
  try {
    const params = new URLSearchParams(filters);
    const response = await fetch(`/api/consultations?${params}`);

    const data = await response.json();
    console.log("consultation---", data);

    if (!response.ok) {
      throw new Error(data.error || "Failed to fetch consultations");
    }

    return data;
  } catch (error) {
    console.error("Error fetching consultations:", error);
    throw error;
  }
};

export default function Consultation() {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingConsultation, setEditingConsultation] =
    useState<Consultation | null>(null);
  const [selectedDoctor, setSelectedDoctor] = useState("");
  const pageSize = 5;

  // Fetch consultations from API
  const loadConsultations = async () => {
    setLoading(true);
    try {
      const filters = {
        page: page.toString(),
        limit: pageSize.toString(),
        ...(search && { search }),
      };

      const response = await fetchConsultations(filters);

      if (response.success) {
        setConsultations(response.data);
        setTotalPages(response.pagination.totalPages);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load consultations",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConsultations();
  }, [page, search]);

  const handleEdit = (consultation: any) => {
    setEditingConsultation(consultation);
    setSelectedDoctor(consultation.consultationWith || "");
    setIsEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (editingConsultation && selectedDoctor) {
      try {
        await updateConsultation(editingConsultation.id, selectedDoctor);

        // Update local state
        setConsultations((prev) =>
          prev.map((c) =>
            c.id === editingConsultation.id
              ? { ...c, consultationWith: selectedDoctor }
              : c
          )
        );

        toast({
          title: "Success",
          description: `Consultation has been reassigned to ${selectedDoctor}`,
          variant: "default",
          duration: 3000,
        });

        setIsEditDialogOpen(false);
        setEditingConsultation(null);
        setSelectedDoctor("");
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to update consultation",
          variant: "destructive",
        });
      }
    }
  };
  const updateConsultationStatus = async (id: string, status: string) => {
    try {
      const response = await fetch(`/api/consultations/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: status,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update consultation status");
      }

      return data;
    } catch (error) {
      console.error("Error updating consultation status:", error);
      throw error;
    }
  };

  const handleStatusUpdate = async (id: string, newStatus: string) => {
    try {
      let apiCall;
      switch (newStatus) {
        case "ASSIGNED":
          apiCall = updateConsultationStatus(id, "ASSIGNED");
          break;
        case "COMPLETED":
          apiCall = updateConsultationStatus(id, "COMPLETED");
          break;
        case "CANCELLED":
          apiCall = updateConsultationStatus(id, "CANCELLED");
          break;
        default:
          throw new Error("Invalid status");
      }

      await apiCall;

      // Update local state
      setConsultations((prev) =>
        prev.map((apt) => (apt.id === id ? { ...apt, status: newStatus } : apt))
      );

      toast({
        title: "Status Updated",
        description: `Consultation status has been updated to ${statusLabels[newStatus]}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update status",
        variant: "destructive",
      });
    }
  };

  const openCancelDialog = (consultation: any) => {
    const confirmCancel = window.confirm(
      `Are you sure you want to cancel the consultation for ${consultation.name} with ${consultation.consultationWith} at ${consultation.consultationTime}?`
    );

    if (confirmCancel) {
      handleStatusUpdate(consultation.id, "CANCELLED");
    }
  };

  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "long",
      day: "numeric",
    };
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, options);
  };

  const getStatusBadge = (status: string) => {
    const statusClasses =
      statusColor[status] || "bg-gray-100 text-gray-700 border-gray-200";
    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-semibold border ${statusClasses}`}
      >
        {statusLabels[status] || status}
      </span>
    );
  };

  return (
    <DashboardLayout>
      <div className="bg-gray-50 rounded-lg p-6 mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
          <div className="flex flex-row items-center gap-4">
            <h1 className="text-2xl font-bold text-gray-800">
              Consultation Management
            </h1>
            <div className="flex items-center gap-2 bg-white rounded-lg px-4 py-2 shadow-sm border border-gray-200">
              <CalendarDays className="h-5 w-5 text-indigo-600" />
              <span className="text-2xl font-bold text-indigo-700">
                {consultations.length}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end mb-4">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search consultations..."
              className="pl-10 pr-4 py-2 bg-white border border-gray-300 rounded-lg w-full text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>
        </div>

        {/* Consultations Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-indigo-700">
                <TableHead className="text-white font-semibold">Name</TableHead>
                <TableHead className="text-white font-semibold">
                  Consultation With
                </TableHead>
                <TableHead className="text-white font-semibold">
                  Date & Time
                </TableHead>
                <TableHead className="text-white font-semibold">
                  Status
                </TableHead>
                <TableHead className="text-white font-semibold text-right">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center py-8 text-gray-500"
                  >
                    Loading consultations...
                  </TableCell>
                </TableRow>
              ) : consultations.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center py-8 text-gray-500"
                  >
                    No consultations found.
                  </TableCell>
                </TableRow>
              ) : (
                consultations.map((consultation) => (
                  <TableRow
                    key={consultation.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <TableCell className="font-medium">
                      <div>
                        <p className="font-semibold">{consultation.name}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {consultation.consultationWith || "Not Assigned"}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">
                          {formatDate(consultation.consultationDate)}
                        </p>
                        <p className="text-sm text-gray-500">
                          {consultation.consultationTime}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(consultation.status)}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          {consultation.status !== "CANCELLED" &&
                            consultation.status !== "COMPLETED" && (
                              <>
                                <DropdownMenuItem
                                  onClick={() => handleEdit(consultation)}
                                >
                                  <Edit className="mr-2 h-4 w-4" />
                                  Edit Consultation
                                </DropdownMenuItem>

                                {consultation.status === "NOT_ASSIGN" && (
                                  <DropdownMenuItem
                                    onClick={() =>
                                      handleStatusUpdate(
                                        consultation.id,
                                        "ASSIGNED"
                                      )
                                    }
                                  >
                                    <CheckCircle className="mr-2 h-4 w-4" />
                                    Mark as Assigned
                                  </DropdownMenuItem>
                                )}

                                {consultation.status === "ASSIGNED" && (
                                  <DropdownMenuItem
                                    onClick={() =>
                                      handleStatusUpdate(
                                        consultation.id,
                                        "COMPLETED"
                                      )
                                    }
                                  >
                                    <Clock className="mr-2 h-4 w-4" />
                                    Mark as Done
                                  </DropdownMenuItem>
                                )}

                                <DropdownMenuSeparator />

                                <DropdownMenuItem
                                  className="text-red-600 focus:text-red-600"
                                  onClick={() => openCancelDialog(consultation)}
                                >
                                  <X className="mr-2 h-4 w-4" />
                                  Cancel Consultation
                                </DropdownMenuItem>
                              </>
                            )}

                          {consultation.status === "CANCELLED" && (
                            <DropdownMenuItem disabled>
                              <X className="mr-2 h-4 w-4" />
                              Consultation Cancelled
                            </DropdownMenuItem>
                          )}

                          {consultation.status === "COMPLETED" && (
                            <DropdownMenuItem disabled>
                              <CheckCircle className="mr-2 h-4 w-4" />
                              Consultation Completed
                            </DropdownMenuItem>
                          )}
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
        {totalPages > 1 && (
          <div className="flex justify-between items-center mt-4 p-4 bg-white rounded-lg shadow-sm">
            <span className="text-sm text-gray-700">
              Page {page} of {totalPages}
            </span>
            <div className="flex gap-2 items-center">
              <Button
                size="icon"
                variant="outline"
                className="border-gray-300 text-gray-700 hover:bg-gray-50"
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pg) => (
                <Button
                  key={pg}
                  size="sm"
                  variant={pg === page ? "default" : "outline"}
                  className={
                    pg === page
                      ? "bg-indigo-600 text-white hover:bg-indigo-700"
                      : "border-gray-300 text-gray-700 hover:bg-gray-50"
                  }
                  onClick={() => setPage(pg)}
                >
                  {pg}
                </Button>
              ))}

              <Button
                size="icon"
                variant="outline"
                className="border-gray-300 text-gray-700 hover:bg-gray-50"
                disabled={page === totalPages}
                onClick={() => setPage(page + 1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Edit Consultation Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Consultation</DialogTitle>
          </DialogHeader>
          {editingConsultation && (
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <p className="text-sm text-gray-600 font-medium">
                  {editingConsultation.name}
                </p>
              </div>

              <div className="space-y-2">
                <Label>Date & Time</Label>
                <p className="text-sm text-gray-600">
                  {formatDate(editingConsultation.consultationDate)} at{" "}
                  {editingConsultation.consultationTime}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="doctor">Consultation With</Label>
                <Select
                  value={selectedDoctor}
                  onValueChange={setSelectedDoctor}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a doctor" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableDoctors.map((doctor) => (
                      <SelectItem key={doctor.value} value={doctor.value}>
                        {doctor.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsEditDialogOpen(false);
                setEditingConsultation(null);
                setSelectedDoctor("");
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveEdit}
              disabled={!selectedDoctor}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
