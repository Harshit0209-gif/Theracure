"use client"

import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { 
  Users, 
  Calendar, 
  FileText,
  Search,
  Eye
} from "lucide-react"
import { useAuth } from "@/contexts/auth-context"

// Mock data for assigned patients
const assignedPatients = [
  {
    id: 1,
    name: "John Doe",
    age: 45,
    condition: "Lower Back Pain",
    lastVisit: "2024-03-15",
    nextAppointment: "2024-03-22",
    status: "Active"
  },
  {
    id: 2,
    name: "Jane Smith",
    age: 32,
    condition: "Shoulder Injury",
    lastVisit: "2024-03-14",
    nextAppointment: "2024-03-21",
    status: "Active"
  },
  {
    id: 3,
    name: "Robert Brown",
    age: 58,
    condition: "Knee Rehabilitation",
    lastVisit: "2024-03-13",
    nextAppointment: "2024-03-20",
    status: "Active"
  }
]

// Mock data for prescriptions
const prescriptions = [
  {
    id: 1,
    patientName: "John Doe",
    date: "2024-03-15",
    exercises: [
      "Lower back stretches",
      "Core strengthening",
      "Posture correction"
    ],
    notes: "Perform exercises twice daily"
  },
  {
    id: 2,
    patientName: "Jane Smith",
    date: "2024-03-14",
    exercises: [
      "Shoulder mobility exercises",
      "Rotator cuff strengthening",
      "Range of motion exercises"
    ],
    notes: "Avoid heavy lifting"
  }
]

export default function TherapistDashboard() {
  const { user } = useAuth()

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <h1 className="text-2xl font-semibold text-gray-800">Welcome, {user?.name || "Therapist"}</h1>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-white shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Assigned Patients</p>
                  <h3 className="text-2xl font-bold mt-1">{assignedPatients.length}</h3>
                </div>
                <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Today's Appointments</p>
                  <h3 className="text-2xl font-bold mt-1">5</h3>
                </div>
                <div className="h-12 w-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <Calendar className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Active Prescriptions</p>
                  <h3 className="text-2xl font-bold mt-1">{prescriptions.length}</h3>
                </div>
                <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                  <FileText className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Assigned Patients */}
        <Card className="bg-white shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-semibold">Assigned Patients</CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  placeholder="Search patients..."
                  className="pl-8 w-[200px]"
                />
              </div>
              <Button variant="ghost" size="sm">View All</Button>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Patient Name</TableHead>
                  <TableHead>Age</TableHead>
                  <TableHead>Condition</TableHead>
                  <TableHead>Last Visit</TableHead>
                  <TableHead>Next Appointment</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assignedPatients.map((patient) => (
                  <TableRow key={patient.id}>
                    <TableCell className="font-medium">{patient.name}</TableCell>
                    <TableCell>{patient.age}</TableCell>
                    <TableCell>{patient.condition}</TableCell>
                    <TableCell>{patient.lastVisit}</TableCell>
                    <TableCell>{patient.nextAppointment}</TableCell>
                    <TableCell>
                      <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">
                        {patient.status}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Recent Prescriptions */}
        <Card className="bg-white shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-semibold">Recent Prescriptions</CardTitle>
            <Button variant="ghost" size="sm">View All</Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Patient Name</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Exercises</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {prescriptions.map((prescription) => (
                  <TableRow key={prescription.id}>
                    <TableCell className="font-medium">{prescription.patientName}</TableCell>
                    <TableCell>{prescription.date}</TableCell>
                    <TableCell>
                      <ul className="list-disc list-inside">
                        {prescription.exercises.map((exercise, index) => (
                          <li key={index} className="text-sm">{exercise}</li>
                        ))}
                      </ul>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">{prescription.notes}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
} 