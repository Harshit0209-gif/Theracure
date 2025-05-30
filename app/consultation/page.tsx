"use client";

import { useState } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import {
  Search,
  Accessibility,
  CalendarCheck2,
  Plus,
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

const consultationData = [
  {
    id: 1,
    name: "Mr. Rohan Mondal",
    nameId: "PT-0258",
    doctor: "Dr. Mainak Sur",
    status: "Not Assigned",
    date: "2024-01-26",
    time: "4:00 PM",
    therapyType: "Manual Therapy",
  },
  {
    id: 2,
    name: "Mr. Rohan Mondal",
    nameId: "PT-0258",
    doctor: "Dr. Mainak Sur",
    status: "Assigned",
    date: "2024-01-26",
    time: "4:00 PM",
    therapyType: "Exercise Therapy",
  },
  {
    id: 3,
    name: "Mr. Rohan Mondal",
    nameId: "PT-0258",
    doctor: "Dr. Mainak Sur",
    status: "Done",
    date: "2024-01-26",
    time: "4:00 PM",
    therapyType: "Electrotherapy",
  },
  {
    id: 4,
    name: "Ms. Priya Sharma",
    nameId: "PT-0259",
    doctor: "Dr. Mainak Sur",
    status: "Assigned",
    date: "2024-01-26",
    time: "5:00 PM",
    therapyType: "Manual Therapy",
  },
  {
    id: 5,
    name: "Mr. Amit Kumar",
    nameId: "PT-0260",
    doctor: "Dr. Mainak Sur",
    status: "Not Assigned",
    date: "2024-01-26",
    time: "5:30 PM",
    therapyType: "Hydrotherapy",
  },
  {
    id: 6,
    name: "Ms. Sneha Das",
    nameId: "PT-0261",
    doctor: "Dr. Mainak Sur",
    status: "Done",
    date: "2024-01-26",
    time: "6:00 PM",
    therapyType: "Heat Therapy",
  },
];

const statusColor: Record<string, string> = {
  "Not Assigned": "bg-red-100 text-red-700 border-red-200",
  Assigned: "bg-green-100 text-green-700 border-green-200",
  Done: "bg-indigo-100 text-indigo-700 border-indigo-200",
  Cancelled: "bg-gray-100 text-gray-700 border-gray-200",
};
const availableDoctors = [
  { value: "dr-mainak-sur", label: "Dr. Mainak Sur (PT)" },
  { value: "dr-diksha-palit", label: "Dr. Diksha Palit (PT)" },
  { value: "dr-diptesh-dey", label: "Dr. Diptesh Dey (PT)" },
];

const Consultation = () => {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [consultations, setConsutations] = useState(consultationData);
  const [page, setPage] = useState(1);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingConsultation, setEditingConsultation] = useState("");
  const [selectedDoctor, setSelectedDoctor] = useState("");
  const pageSize = 5;

  // Filter consultations based on search
  const filtered = consultations.filter(
    (a) =>
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.nameId.toLowerCase().includes(search.toLowerCase()) ||
      a.doctor.toLowerCase().includes(search.toLowerCase())
  );

  const handleEdit = (consultation: string) => {
    setEditingConsultation(consultation);
    setSelectedDoctor(consultation);
    setIsEditDialogOpen(true);
  };

  const handleSaveEdit = () => {
    if (editingConsultation && selectedDoctor) {
      setConsutations((prev) =>
        prev.map((c) =>
          c.id === editingConsultation.id ? { ...c, doctor: selectedDoctor } : c
        )
      );

      toast({
        title: "Consultation Updated",
        description: `Consultation has been reassigned to ${selectedDoctor}`,
      });

      setIsEditDialogOpen(false);
      setEditingConsultation("");
      setSelectedDoctor("");
    }
  };

  // Pagination
  const totalPages = Math.ceil(filtered.length / pageSize);
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  const handleStatusUpdate = (id: number, newStatus: string) => {
    setConsutations((prev) =>
      prev.map((apt) => (apt.id === id ? { ...apt, status: newStatus } : apt))
    );

    toast({
      title: "Status Updated",
      description: `Consutation status has been updated to ${newStatus}`,
    });
  };

  const openCancelDialog = (consultation: any) => {
    const confirmCancel = window.confirm(
      `Are you sure you want to cancel the consultation for ${consultation.name} with ${consultation.doctor} at ${consultation.time}?`
    );

    if (confirmCancel) {
      handleStatusUpdate(consultation.id, "Cancelled");
      toast({
        title: "Consutation Cancelled",
        description: `Consutation for ${consultation.name} has been cancelled.`,
        variant: "destructive",
      });
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
        {status}
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
              <span className="text-gray-600 text-sm">consultations today</span>
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

        {/* Consutations Table */}
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
              {paginated.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center py-8 text-gray-500"
                  >
                    No consultations found.
                  </TableCell>
                </TableRow>
              ) : (
                paginated.map((consultation) => (
                  <TableRow
                    key={consultation.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <TableCell className="font-medium">
                      <div>
                        <p className="font-semibold">{consultation.name}</p>
                      </div>
                    </TableCell>
                    <TableCell>{consultation.doctor}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">
                          {formatDate(consultation.date)}
                        </p>
                        <p className="text-sm text-gray-500">
                          {consultation.time}
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
                          {consultation.status !== "Cancelled" &&
                            consultation.status !== "Done" && (
                              <>
                                <DropdownMenuItem
                                  onClick={() => handleEdit(consultation)}
                                >
                                  <Edit className="mr-2 h-4 w-4" />
                                  Edit Consultation
                                </DropdownMenuItem>

                                {consultation.status === "Not Assigned" && (
                                  <DropdownMenuItem
                                    onClick={() =>
                                      handleStatusUpdate(
                                        consultation.id,
                                        "Assigned"
                                      )
                                    }
                                  >
                                    <CheckCircle className="mr-2 h-4 w-4" />
                                    Mark as Assigned
                                  </DropdownMenuItem>
                                )}

                                {consultation.status === "Assigned" && (
                                  <DropdownMenuItem
                                    onClick={() =>
                                      handleStatusUpdate(
                                        consultation.id,
                                        "Done"
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
                                  Cancel Consutation
                                </DropdownMenuItem>
                              </>
                            )}

                          {consultation.status === "Cancelled" && (
                            <DropdownMenuItem disabled>
                              <X className="mr-2 h-4 w-4" />
                              Consutation Cancelled
                            </DropdownMenuItem>
                          )}

                          {consultation.status === "Done" && (
                            <DropdownMenuItem disabled>
                              <CheckCircle className="mr-2 h-4 w-4" />
                              Consutation Completed
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
        {filtered.length > pageSize && (
          <div className="flex justify-between items-center mt-4 p-4 bg-white rounded-lg shadow-sm">
            <span className="text-sm text-gray-700">
              Showing {(page - 1) * pageSize + 1} to{" "}
              {Math.min(page * pageSize, filtered.length)} of {filtered.length}{" "}
              consultations
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
      {/* edit consultation */}
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
                  {formatDate(editingConsultation.date)} at{" "}
                  {editingConsultation.time}
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
                      <SelectItem key={doctor.value} value={doctor.label}>
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
                setEditingConsultation("");
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
};

export default Consultation;
