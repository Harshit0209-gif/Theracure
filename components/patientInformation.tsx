import React, { useState, useEffect } from 'react'
import { 
  User, 
  Search, 
  Loader2, 
  CheckCircle, 
  AlertCircle, 
  Phone, 
  Mail, 
  MapPin, 
  Calendar,
  UserCheck,
  Clock,
  RefreshCw
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"

interface PatientDetails {
  patientId: string
  name: string
  phone: string
  email: string
  address: string
  dateOfBirth: string
  gender: string
  emergencyContact: string
  lastVisit: string
  totalVisits: number
  status: string
}

// Mock patient database - replace with actual API call
const mockPatientDatabase = [
  {
    patientId: "PT-0258",
    name: "Rohan Mondal",
    phone: "9800095652",
    email: "rohan.mondal@email.com",
    address: "123 Park Street, Kolkata, West Bengal 700016",
    dateOfBirth: "1985-03-15",
    gender: "Male",
    emergencyContact: "9800095653",
    lastVisit: "2024-01-20",
    totalVisits: 12,
    status: "Active"
  },
  {
    patientId: "PT-0259",
    name: "Priya Sharma",
    phone: "9876543210",
    email: "priya.sharma@email.com",
    address: "456 Salt Lake, Sector V, Kolkata, West Bengal 700091",
    dateOfBirth: "1990-07-22",
    gender: "Female",
    emergencyContact: "9876543211",
    lastVisit: "2024-01-25",
    totalVisits: 8,
    status: "Active"
  },
  {
    patientId: "PT-0260",
    name: "Amit Kumar",
    phone: "8765432109",
    email: "amit.kumar@email.com",
    address: "789 New Town, Action Area 1, Kolkata, West Bengal 700156",
    dateOfBirth: "1988-11-10",
    gender: "Male",
    emergencyContact: "8765432108",
    lastVisit: "2024-01-18",
    totalVisits: 15,
    status: "Active"
  }
]

const PatientInformationCard = () => {
  const [isSearching, setIsSearching] = useState(false)
  const [searchStatus, setSearchStatus] = useState('idle')
  const [patientDetails, setPatientDetails] = useState<PatientDetails | null>(null)
  const [searchId, setSearchId] = useState('')
  const { toast } = useToast()

  // Simulate API call to fetch patient data
  const fetchPatientData = async (patientId: string) => {
    if (!patientId || patientId.length < 3) {
      setSearchStatus('idle')
      setPatientDetails(null)
      return
    }

    setIsSearching(true)
    setSearchStatus('loading')

    try {
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const patient = mockPatientDatabase.find(p => 
        p.patientId.toLowerCase().includes(patientId.toLowerCase())
      )

      if (patient) {
        setPatientDetails(patient)
        setSearchStatus('found')
        toast({
          title: "Patient Found",
          description: `Successfully loaded data for ${patient.name}`,
        })
      } else {
        setPatientDetails(null)
        setSearchStatus('not-found')
        toast({
          title: "Patient Not Found",
          description: "No patient found with this ID.",
          variant: "destructive"
        })
      }
    } catch (error) {
      setSearchStatus('not-found')
      toast({
        title: "Search Error",
        description: "Failed to search for patient. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsSearching(false)
    }
  }

  // Handle patient ID input change
  const handlePatientIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchId(value)
    
    if (value.length >= 3) {
      const timer = setTimeout(() => {
        fetchPatientData(value)
      }, 500)
      return () => clearTimeout(timer)
    } else {
      setSearchStatus('idle')
      setPatientDetails(null)
    }
  }

  // Manual search trigger
  const handleManualSearch = () => {
    if (searchId) {
      fetchPatientData(searchId)
    }
  }

  // Clear patient data
  const handleClearPatient = () => {
    setSearchId('')
    setPatientDetails(null)
    setSearchStatus('idle')
  }

  // Get search status icon
  const getSearchIcon = () => {
    switch (searchStatus) {
      case 'loading':
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
      case 'found':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'not-found':
        return <AlertCircle className="h-4 w-4 text-red-500" />
      default:
        return <Search className="h-4 w-4 text-gray-400" />
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5 text-indigo-600" />
          Patient Information
          {patientDetails && (
            <Badge variant="outline" className="ml-auto">
              <UserCheck className="h-3 w-3 mr-1" />
              Found
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Patient ID Search */}
        <div>
          <Label htmlFor="patientId">Patient ID</Label>
          <div className="flex gap-2 mt-1">
            <div className="relative flex-1">
              <Input
                id="patientId"
                value={searchId}
                onChange={handlePatientIdChange}
                placeholder="e.g., PT-0258"
                className="pr-10"
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                {getSearchIcon()}
              </div>
            </div>
            
            {patientDetails && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleClearPatient}
                className="px-3"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            )}
          </div>
          {searchStatus === 'loading' && (
            <p className="text-sm text-blue-600 mt-1 flex items-center gap-1">
              <Loader2 className="h-3 w-3 animate-spin" />
              Searching for patient...
            </p>
          )}
          {searchStatus === 'not-found' && (
            <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              Patient not found.
            </p>
          )}
        </div>

        {/* Patient Details View */}
        {patientDetails && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-green-800">Patient Details</h4>
              <Badge variant={patientDetails.status === 'Active' ? 'default' : 'secondary'}>
                {patientDetails.status}
              </Badge>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-green-600" />
                <span className="font-medium">{patientDetails.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-green-600" />
                <span>{patientDetails.phone}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-green-600" />
                <span>{patientDetails.email}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-green-600" />
                <span>Last Visit: {new Date(patientDetails.lastVisit).toLocaleDateString('en-IN')}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-green-600" />
                <span>Total Visits: {patientDetails.totalVisits}</span>
              </div>
              <div className="flex items-center gap-2">
                <UserCheck className="h-4 w-4 text-green-600" />
                <span>DOB: {new Date(patientDetails.dateOfBirth).toLocaleDateString('en-IN')}</span>
              </div>
            </div>
            
            <div className="flex items-start gap-2 pt-2 border-t border-green-200">
              <MapPin className="h-4 w-4 text-green-600 mt-0.5" />
              <span className="text-sm">{patientDetails.address}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default PatientInformationCard