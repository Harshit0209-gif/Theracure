"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Search, ChevronLeft, ChevronRight, User, Phone, Mail, MapPin, Calendar, FileText, X } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { AddPatientDialog } from "./add-patient-dialog"
import { toast } from "@/hooks/use-toast"

// Patient interface matching your Prisma schema
interface Patient {
  id: string // THRC000001 format
  patientName: string
  age: number
  gender: string
  address?: string
  phone?: string
  email?: string
  referenceDoctor?: string
  medicalHistory?: string
  createdById: string
  createdAt: string
  updatedAt: string
}

interface PaginationInfo {
  total: number
  pages: number
  page: number
  limit: number
}

interface ApiResponse {
  success: boolean
  patients: Patient[]
  pagination: PaginationInfo
}

export function PatientManagementSection() {
  const { user } = useAuth()
  const isTherapist = user?.role === "therapist"
  
  // State management
  const [searchQuery, setSearchQuery] = useState("")
  const [patients, setPatients] = useState<Patient[]>([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState<PaginationInfo>({
    total: 0,
    pages: 0,
    page: 1,
    limit: 5
  })
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)
  const [detailsOpen, setDetailsOpen] = useState(false)

  // Fetch patients from API
  const fetchPatients = async (page: number = 1, search: string = "") => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString(),
        ...(search && { search })
      })

      const response = await fetch(`/api/patients?${params}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch patients')
      }

      const data: ApiResponse = await response.json()
      
      if (data.success) {
        setPatients(data.patients)
        setPagination(data.pagination)
      } else {
        throw new Error('API returned error')
      }
    } catch (error) {
      console.error('Error fetching patients:', error)
      toast({
        title: "Error",
        description: "Failed to fetch patients. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Initial load
  useEffect(() => {
    fetchPatients()
  }, [])

  // Handle search with debounce
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchPatients(1, searchQuery)
    }, 500)

    return () => clearTimeout(timeoutId)
  }, [searchQuery])

  // Handle page change
  const handlePageChange = (newPage: number) => {
    fetchPatients(newPage, searchQuery)
  }

  // Handle patient details view
  const handleViewDetails = (patient: Patient) => {
    setSelectedPatient(patient)
    setDetailsOpen(true)
  }

  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Patient Details Card Component
  const PatientDetailsCard = ({ patient }: { patient: Patient }) => (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-xl">
          <User className="h-5 w-5 text-indigo-600" />
          Patient Details
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Basic Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-600">Patient ID</label>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="bg-indigo-100 text-indigo-800">
                {patient.id}
              </Badge>
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-600">Name</label>
            <p className="text-lg font-semibold text-gray-900">{patient.patientName}</p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-600">Age</label>
            <p className="text-gray-900">{patient.age} years</p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-600">Gender</label>
            <Badge variant="outline" className="capitalize">
              {patient.gender}
            </Badge>
          </div>
        </div>

        {/* Contact Info */}
        <div className="border-t pt-4">
          <h4 className="font-medium text-gray-900 mb-3">Contact Information</h4>
          <div className="space-y-3">
            {patient.phone && (
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-gray-500" />
                <span className="text-gray-900">{patient.phone}</span>
              </div>
            )}
            
            {patient.email && (
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-gray-500" />
                <span className="text-gray-900">{patient.email}</span>
              </div>
            )}
            
            {patient.address && (
              <div className="flex items-start gap-3">
                <MapPin className="h-4 w-4 text-gray-500 mt-1" />
                <span className="text-gray-900">{patient.address}</span>
              </div>
            )}
          </div>
        </div>

        {/* Medical Info */}
        <div className="border-t pt-4">
          <h4 className="font-medium text-gray-900 mb-3">Medical Information</h4>
          <div className="space-y-3">
            {patient.referenceDoctor && (
              <div>
                <label className="text-sm font-medium text-gray-600">Reference Doctor</label>
                <p className="text-gray-900">{patient.referenceDoctor}</p>
              </div>
            )}
            
            {patient.medicalHistory && (
              <div>
                <label className="text-sm font-medium text-gray-600">Medical History</label>
                <div className="mt-1 p-3 bg-gray-50 rounded-lg">
                  <p className="text-gray-900 whitespace-pre-wrap">{patient.medicalHistory}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Timestamps */}
        <div className="border-t pt-4">
          <h4 className="font-medium text-gray-900 mb-3">Registration Info</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>Created: {formatDate(patient.createdAt)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>Updated: {formatDate(patient.updatedAt)}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="bg-gray-200 rounded-lg p-6 mb-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-800">Patient Management System</h2>
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
          {!isTherapist && <AddPatientDialog />}
        </div>
      </div>

      <div className="bg-white rounded-b-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-indigo-700">
              <TableHead className="font-semibold text-white">Sl. No</TableHead>
              <TableHead className="font-semibold text-white">Patient Name</TableHead>
              <TableHead className="font-semibold text-white">Patient ID</TableHead>
              <TableHead className="font-semibold text-white">Age</TableHead>
              <TableHead className="font-semibold text-white">Gender</TableHead>
              <TableHead className="font-semibold text-white">Phone</TableHead>
              <TableHead className="font-semibold text-white">Details</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
                    <span className="ml-2 text-gray-600">Loading patients...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : patients.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                  {searchQuery ? 'No patients found matching your search.' : 'No patients found.'}
                </TableCell>
              </TableRow>
            ) : (
              patients.map((patient, index) => (
                <TableRow key={patient.id} className="hover:bg-gray-50">
                  <TableCell>{(pagination.page - 1) * pagination.limit + index + 1}</TableCell>
                  <TableCell className="font-medium">{patient.patientName}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="bg-indigo-100 text-indigo-800">
                      {patient.id}
                    </Badge>
                  </TableCell>
                  <TableCell>{patient.age}</TableCell>
                  <TableCell className="capitalize">{patient.gender}</TableCell>
                  <TableCell>{patient.phone || 'N/A'}</TableCell>
                  <TableCell>
                    <Dialog open={detailsOpen && selectedPatient?.id === patient.id} onOpenChange={setDetailsOpen}>
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
                          <DialogTitle className="sr-only">Patient Details</DialogTitle>
                        </DialogHeader>
                        {selectedPatient && <PatientDetailsCard patient={selectedPatient} />}
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
              Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
              {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} patients
            </span>
            <div className="flex items-center space-x-2">
              <Button
                size="sm"
                variant="outline"
                className="border-indigo-600 text-indigo-700 hover:bg-indigo-50"
                disabled={pagination.page === 1}
                onClick={() => handlePageChange(pagination.page - 1)}
              >
                <ChevronLeft className="h-4 w-4" />Previous
              </Button>
              
              {/* Page Numbers */}
              <div className="flex items-center space-x-1">
                {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((pg) => (
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
                ))}
              </div>
              
              <Button
                size="sm"
                variant="outline"
                className="border-indigo-600 text-indigo-700 hover:bg-indigo-50"
                disabled={pagination.page === pagination.pages}
                onClick={() => handlePageChange(pagination.page + 1)}
              >
                Next<ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}