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
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  FileText,
  X,
  Edit3,
  Heart,
  Ruler,
  Weight,
} from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { AddPatientDialog } from "./add-patient-dialog";
import { toast } from "@/hooks/use-toast";
import { calculateSimpleBMI } from "@/lib/utils/bmi-claculator";
import { UserRole } from "@prisma/client";

interface Patient {
  id: string;
  patientName: string;
  age: number;
  gender: string;
  height?: number;
  weight?: number;
  address?: string;
  phone?: string;
  email?: string;
  medicalHistory?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

interface PaginationInfo {
  total: number;
  pages: number;
  page: number;
  limit: number;
}

interface ApiResponse {
  success: boolean;
  patients: Patient[];
  pagination: PaginationInfo;
}

export function PatientManagementSection() {
  const { user } = useAuth();
  const isTherapist = user?.role === UserRole.THERAPIST;

  const [searchQuery, setSearchQuery] = useState("");
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<PaginationInfo>({
    total: 0,
    pages: 0,
    page: 1,
    limit: 20,
  });
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  // Fetch patients from API
  const fetchPatients = async (page: number = 1, search: string = "") => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString(),
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

  // Handle page change
  const handlePageChange = (newPage: number) => {
    fetchPatients(newPage, searchQuery);
  };

  // Handle patient details view
  const handleViewDetails = (patient: Patient) => {
    setSelectedPatient(patient);
    setDetailsOpen(true);
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const InfoCard = ({
    icon: Icon,
    label,
    value,
    className = "",
  }: {
    icon: React.ComponentType<any>;
    label: string;
    value: React.ReactNode;
    className?: string;
  }) => (
    <div
      className={`bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-4 border border-gray-200 ${className}`}
    >
      <div className="flex items-center gap-3">
        <div className="flex-shrink-0">
          <Icon className="h-5 w-5 text-indigo-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-600 mb-1">{label}</p>
          <p className="text-lg font-semibold text-gray-900 truncate">
            {value}
          </p>
        </div>
      </div>
    </div>
  );

  // Patient Details Card Component
  const PatientDetailsCard = ({ patient }: { patient: Patient }) => {
    // const handleEdit = () => {
    //   if (onEdit) {
    //     onEdit(patient);
    //   } else {
    //     alert("Edit functionality not implemented yet");
    //   }
    // };
    console.log("deatils view..", patient);
    const bmiResult = calculateSimpleBMI(
      patient.weight || 0,
      patient.height || 0
    );

    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader className="pb-4 bg-gradient-to-r from-indigo-50 to-blue-50 rounded-t-xl border-b border-gray-200">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-3 text-xl text-gray-800">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <User className="h-6 w-6 text-indigo-600" />
              </div>
              Patient Profile
            </CardTitle>
            <Button className="gap-2">
              <Edit3 className="h-4 w-4" />
              Edit Details
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-8">
          {/* Patient ID Badge */}
          <div className="flex justify-center">
            <Badge
              variant="secondary"
              className="text-base px-4 py-2 bg-indigo-100 text-indigo-800 border border-indigo-200"
            >
              Patient ID: {patient.id}
            </Badge>
          </div>

          {/* Basic Information Grid */}
          <div>
            <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Heart className="h-5 w-5 text-red-500" />
              Basic Information
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <InfoCard
                icon={User}
                label="Full Name"
                value={
                  <span
                    className="break-words whitespace-pre-wrap"
                    title={patient.patientName}
                  >
                    {patient.patientName}
                  </span>
                }
              />
              <InfoCard
                icon={Calendar}
                label="Age"
                value={`${patient.age} years`}
              />
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-4 border border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0">
                    <User className="h-5 w-5 text-indigo-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-600 mb-1">
                      Gender
                    </p>
                    <Badge variant="outline" className="capitalize text-sm">
                      {patient.gender}
                    </Badge>
                  </div>
                </div>
              </div>
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-4 border border-green-200">
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0">
                    <Badge variant="success" className="text-xs">
                      ACTIVE
                    </Badge>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-600 mb-1">
                      Status
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Physical Measurements */}
          <div>
            <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Ruler className="h-5 w-5 text-blue-500" />
              Physical Measurements
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InfoCard
                icon={Ruler}
                label="Height"
                value={patient.height ? `${patient.height} cm` : "0"}
                className="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200"
              />
              <InfoCard
                icon={Weight}
                label="Weight"
                value={patient.weight ? `${patient.weight} kg` : "0.0"}
                className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200"
              />
              <InfoCard
                icon={Heart}
                label="BMI"
                value={
                  bmiResult ? `${bmiResult.bmi} (${bmiResult.status})` : "0.0"
                }
                className="bg-gradient-to-br from-orange-50 to-yellow-50 border-yellow-200"
              />
            </div>
          </div>

          {/* Contact Information */}
          <div>
            <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Phone className="h-5 w-5 text-green-500" />
              Contact Information
            </h4>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {patient.phone && (
                <InfoCard
                  icon={Phone}
                  label="Phone Number"
                  value={patient.phone}
                  className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200"
                />
              )}
              {patient.email && (
                <InfoCard
                  icon={Mail}
                  label="Email Address"
                  value={patient.email}
                  className="bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200"
                />
              )}
              {patient.address && (
                <div className="lg:col-span-1 bg-gradient-to-br from-red-50 to-pink-50 rounded-lg p-4 border border-red-200">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0">
                      <MapPin className="h-5 w-5 text-indigo-600 mt-0.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-600 mb-1">
                        Address
                      </p>
                      <p className="text-sm font-semibold text-gray-900 leading-relaxed">
                        {patient.address}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Medical Information */}
          <div>
            <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Heart className="h-5 w-5 text-red-500" />
              Medical Information
            </h4>
            <div className="space-y-4">
              {patient.medicalHistory && (
                <div className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-lg p-5 border border-amber-200">
                  <label className="text-sm font-medium text-gray-600 block mb-3">
                    Medical History
                  </label>
                  <div className="bg-white rounded-lg p-4 border border-amber-200 shadow-sm">
                    <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">
                      {patient.medicalHistory}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Registration Information */}
          <div className="border-t border-gray-200 pt-6">
            <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Calendar className="h-5 w-5 text-purple-500" />
              Registration Information
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-lg p-4 border border-purple-200">
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-purple-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Registration Date
                    </p>
                    <p className="text-sm font-semibold text-gray-900">
                      {formatDate(patient.createdAt)}
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-gradient-to-br from-teal-50 to-cyan-50 rounded-lg p-4 border border-teal-200">
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-teal-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Last Updated
                    </p>
                    <p className="text-sm font-semibold text-gray-900">
                      {formatDate(patient.updatedAt)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
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
              <TableHead className="font-semibold text-white">Age</TableHead>
              <TableHead className="font-semibold text-white">Gender</TableHead>
              <TableHead className="font-semibold text-white">Phone</TableHead>
              <TableHead className="font-semibold text-white">
                Details
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
                    {(pagination.page - 1) * pagination.limit + index + 1}
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
                    <Dialog
                      open={detailsOpen && selectedPatient?.id === patient.id}
                      onOpenChange={setDetailsOpen}
                    >
                      <DialogTrigger asChild>
                        <Button
                          variant="link"
                          className="text-indigo-700 hover:text-indigo-900 p-0"
                          onClick={() => handleViewDetails(patient)}
                        >
                          View Details
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle className="sr-only">
                            Patient Details
                          </DialogTitle>
                        </DialogHeader>
                        {selectedPatient && (
                          <PatientDetailsCard patient={selectedPatient} />
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
        {!loading && patients.length > 0 && (
          <div className="flex justify-between items-center p-4 bg-white border-t">
            <span className="text-sm text-gray-700">
              Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
              {Math.min(pagination.page * pagination.limit, pagination.total)}{" "}
              of {pagination.total} patients
            </span>
            <div className="flex items-center space-x-2">
              <Button
                size="sm"
                variant="outline"
                className="border-indigo-600 text-indigo-700 hover:bg-indigo-50"
                disabled={pagination.page === 1}
                onClick={() => handlePageChange(pagination.page - 1)}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>

              {/* Page Numbers */}
              <div className="flex items-center space-x-1">
                {Array.from({ length: pagination.pages }, (_, i) => i + 1).map(
                  (pg) => (
                    <Button
                      key={pg}
                      size="sm"
                      variant={pg === pagination.page ? "default" : "outline"}
                      className={
                        pg === pagination.page
                          ? "bg-indigo-600 text-white hover:bg-indigo-700 border-indigo-600 w-8 h-8 p-0"
                          : "text-indigo-700 hover:bg-indigo-50 w-8 h-8 p-0"
                      }
                      onClick={() => handlePageChange(pg)}
                    >
                      {pg}
                    </Button>
                  )
                )}
              </div>

              <Button
                size="sm"
                variant="outline"
                className="border-indigo-600 text-indigo-700 hover:bg-indigo-50"
                disabled={pagination.page === pagination.pages}
                onClick={() => handlePageChange(pagination.page + 1)}
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
