"use client"

import { useState } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  Search,
  Plus,
  Edit,
  UserCog,
  Filter,
  MoreHorizontal,
  Stethoscope,
  Briefcase,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { toast } from "@/components/ui/use-toast";

const employeeData = [
  {
    id: 1,
    name: "Dr. Sarah Johnson",
    role: "Senior Physiotherapist",
    specialty: "Sports Injuries",
    patients: 28,
    appointments: 18,
    performance: 92,
    avatar: "/placeholder.svg?height=32&width=32",
  },
  {
    id: 2,
    name: "Dr. Michael Chen",
    role: "Physiotherapist",
    specialty: "Orthopedic Rehabilitation",
    patients: 24,
    appointments: 15,
    performance: 88,
    avatar: "/placeholder.svg?height=32&width=32",
  },
  {
    id: 3,
    name: "Dr. Lisa Patel",
    role: "Physiotherapist",
    specialty: "Neurological Rehabilitation",
    patients: 22,
    appointments: 14,
    performance: 90,
    avatar: "/placeholder.svg?height=32&width=32",
  },
  {
    id: 4,
    name: "Dr. James Wilson",
    role: "Junior Physiotherapist",
    specialty: "Geriatric Care",
    patients: 18,
    appointments: 12,
    performance: 85,
    avatar: "/placeholder.svg?height=32&width=32",
  },
  // More dummy employees for pagination
  {
    id: 5,
    name: "Dr. Priya Singh",
    role: "Physiotherapist",
    specialty: "Pediatric Therapy",
    patients: 20,
    appointments: 13,
    performance: 87,
    avatar: "/placeholder.svg?height=32&width=32",
  },
  {
    id: 6,
    name: "Dr. Alex Kim",
    role: "Senior Physiotherapist",
    specialty: "Sports Injuries",
    patients: 30,
    appointments: 20,
    performance: 93,
    avatar: "/placeholder.svg?height=32&width=32",
  },
  {
    id: 7,
    name: "Dr. Emily Clark",
    role: "Physiotherapist",
    specialty: "Orthopedic Rehabilitation",
    patients: 25,
    appointments: 16,
    performance: 89,
    avatar: "/placeholder.svg?height=32&width=32",
  },
  {
    id: 8,
    name: "Dr. David Brown",
    role: "Junior Physiotherapist",
    specialty: "Geriatric Care",
    patients: 17,
    appointments: 11,
    performance: 84,
    avatar: "/placeholder.svg?height=32&width=32",
  },
  {
    id: 9,
    name: "Dr. Olivia White",
    role: "Physiotherapist",
    specialty: "Neurological Rehabilitation",
    patients: 23,
    appointments: 15,
    performance: 91,
    avatar: "/placeholder.svg?height=32&width=32",
  },
  {
    id: 10,
    name: "Dr. Ethan Green",
    role: "Physiotherapist",
    specialty: "Sports Injuries",
    patients: 21,
    appointments: 14,
    performance: 86,
    avatar: "/placeholder.svg?height=32&width=32",
  },
]

export default function Clients() {
  // Pagination state
  const [page, setPage] = useState(1)
  const pageSize = 5
  const totalPages = Math.ceil(employeeData.length / pageSize)
  const paginatedEmployees = employeeData.slice((page - 1) * pageSize, page * pageSize)

  return (
    <DashboardLayout>
      <div className="mb-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-800">Employee Management</h2>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="flex items-center gap-1 border-indigo-600 text-indigo-700 hover:bg-indigo-50">
              <Filter className="h-4 w-4" />
              Filter
            </Button>
            {/* <Button size="sm" className="flex items-center gap-1 bg-indigo-600 hover:bg-indigo-700 text-white">
              <Plus className="h-4 w-4" />
              Add Employee
            </Button> */}
            <Dialog>
          <DialogTrigger asChild>
           <Button size="sm" className="flex items-center gap-1 bg-indigo-600 hover:bg-indigo-700 text-white">
              <Plus className="h-4 w-4" />
              Add Employee
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Add New Employee</DialogTitle>
              <DialogDescription>Add a new employee to the system. Fill in all the required details.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Full Name
                </Label>
                <Input id="name" placeholder="Dr. John Smith" className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="role" className="text-right">
                  Role
                </Label>
                <Select>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="senior">Senior Physiotherapist</SelectItem>
                    <SelectItem value="physio">Physiotherapist</SelectItem>
                    <SelectItem value="junior">Junior Physiotherapist</SelectItem>
                    <SelectItem value="admin">Administrative Staff</SelectItem>
                    <SelectItem value="reception">Receptionist</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="specialty" className="text-right">
                  Specialty
                </Label>
                <Select>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select specialty" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sports">Sports Injuries</SelectItem>
                    <SelectItem value="ortho">Orthopedic Rehabilitation</SelectItem>
                    <SelectItem value="neuro">Neurological Rehabilitation</SelectItem>
                    <SelectItem value="geriatric">Geriatric Care</SelectItem>
                    <SelectItem value="pediatric">Pediatric Therapy</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="email" className="text-right">
                  Email
                </Label>
                <Input id="email" type="email" placeholder="john.smith@physioplus.com" className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="phone" className="text-right">
                  Phone
                </Label>
                <Input id="phone" type="tel" placeholder="555-123-4567" className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="startDate" className="text-right">
                  Start Date
                </Label>
                <Input id="startDate" type="date" className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="bio" className="text-right">
                  Bio
                </Label>
                <Textarea id="bio" placeholder="Brief professional bio" className="col-span-3" />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="submit"
                className="bg-indigo-600 hover:bg-indigo-700 text-white"
                onClick={() => {
                  toast({
                    title: "Employee added",
                    description: "New employee has been added successfully",
                  })
                }}
              >
                Add Employee
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="p-4 flex items-center">
              <div className="bg-teal-50 p-3 rounded-full mr-4">
                <UserCog className="h-6 w-6 text-teal-500" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Employees</p>
                <h3 className="text-2xl font-bold">12</h3>
                <p className="text-xs text-green-600">+2 this month</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center">
              <div className="bg-blue-50 p-3 rounded-full mr-4">
                <Stethoscope className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Physiotherapists</p>
                <h3 className="text-2xl font-bold">8</h3>
                <p className="text-xs text-blue-600">67% of staff</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center">
              <div className="bg-amber-50 p-3 rounded-full mr-4">
                <Briefcase className="h-6 w-6 text-amber-500" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Support Staff</p>
                <h3 className="text-2xl font-bold">4</h3>
                <p className="text-xs text-amber-600">33% of staff</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="bg-gray-200 rounded-lg overflow-hidden mb-6 border">
          <CardHeader className="flex flex-row flex-wrap items-center justify-between mb-3 pb-0">
            <h2 className="text-xl font-semibold text-gray-800 w-fit">Employee Directory</h2>
            <div className="flex flex-col md:flex-row justify-between mb-4 gap-4">
              <div className="relative w-full md:w-[400px]">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-indigo-400" />
                <input
                  type="text"
                  placeholder="Search employee by name, role, or specialty"
                  className="pl-10 pr-4 py-2 bg-white border border-indigo-300 rounded-lg w-full text-sm placeholder:text-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                />
              </div>
              <Select>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="senior">Senior Physiotherapist</SelectItem>
                  <SelectItem value="physio">Physiotherapist</SelectItem>
                  <SelectItem value="junior">Junior Physiotherapist</SelectItem>
                  <SelectItem value="admin">Administrative</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent className="p-4 ">

            <div className="overflow-x-auto bg-white rounded-b-lg">
              <Table>
                <TableHeader>
                  <TableRow className="bg-indigo-700">
                    <TableHead className="whitespace-nowrap font-semibold text-white">Employee</TableHead>
                    <TableHead className="whitespace-nowrap font-semibold text-white">Role</TableHead>
                    <TableHead className="whitespace-nowrap font-semibold text-white">Specialty</TableHead>
                    <TableHead className="whitespace-nowrap font-semibold text-white">Patients</TableHead>
                    <TableHead className="whitespace-nowrap font-semibold text-white">Appointments</TableHead>
                    <TableHead className="whitespace-nowrap font-semibold text-white">Performance</TableHead>
                    <TableHead className="whitespace-nowrap font-semibold text-white">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedEmployees.map((employee) => (
                    <TableRow key={employee.id} className="hover:bg-transparent !hover:bg-transparent">
                      <TableCell>
                        <div className="flex items-center">
                          <Avatar className="h-8 w-8 mr-3">
                            <AvatarImage src={employee.avatar || "/placeholder.svg"} alt={employee.name} />
                            <AvatarFallback>
                              {employee.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{employee.name}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{employee.role}</TableCell>
                      <TableCell>{employee.specialty}</TableCell>
                      <TableCell>{employee.patients}</TableCell>
                      <TableCell>{employee.appointments}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress value={employee.performance} className="h-2 w-24" />
                          <span className="text-sm">{employee.performance}%</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>View Profile</DropdownMenuItem>
                              <DropdownMenuItem>View Schedule</DropdownMenuItem>
                              <DropdownMenuItem>Performance Review</DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-red-600">Deactivate</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            {/* Pagination Controls */}
            <div className="flex justify-between items-center p-4 bg-white border-t ">
              <span className="text-sm text-gray-700">
                Page {page} of {totalPages}
              </span>
              <div className="flex gap-2 items-center">
                <Button
                  size="sm"
                  variant="outline"
                  className="bborder-indigo-600 text-indigo-700 hover:bg-indigo-50"
                  disabled={page === 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  <ChevronLeft className="h-4 w-4" />Previous
                </Button>
                {/* Page Numbers */}
                <div className="flex items-center space-x-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pg) => (
                  <Button
                    key={pg}
                    size="sm"
                    variant={pg === page ? "default" : "outline"}
                    className={
                      pg === page
                        ? "bg-indigo-600 text-white hover:bg-indigo-700 border-indigo-600"
                        : "border-indigo-600 text-indigo-700 hover:bg-indigo-50"
                    }
                    onClick={() => setPage(pg)}
                  >
                    {pg}
                  </Button>
                ))}
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-indigo-600 text-indigo-700 hover:bg-indigo-50"
                  disabled={page === totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  Next<ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
            </div>
          </CardContent>
        </div>

        {/* <Dialog>
          <DialogTrigger asChild>
            <Button className="mb-6 bg-indigo-600 hover:bg-indigo-700 text-white">Add New Employee</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Add New Employee</DialogTitle>
              <DialogDescription>Add a new employee to the system. Fill in all the required details.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Full Name
                </Label>
                <Input id="name" placeholder="Dr. John Smith" className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="role" className="text-right">
                  Role
                </Label>
                <Select>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="senior">Senior Physiotherapist</SelectItem>
                    <SelectItem value="physio">Physiotherapist</SelectItem>
                    <SelectItem value="junior">Junior Physiotherapist</SelectItem>
                    <SelectItem value="admin">Administrative Staff</SelectItem>
                    <SelectItem value="reception">Receptionist</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="specialty" className="text-right">
                  Specialty
                </Label>
                <Select>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select specialty" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sports">Sports Injuries</SelectItem>
                    <SelectItem value="ortho">Orthopedic Rehabilitation</SelectItem>
                    <SelectItem value="neuro">Neurological Rehabilitation</SelectItem>
                    <SelectItem value="geriatric">Geriatric Care</SelectItem>
                    <SelectItem value="pediatric">Pediatric Therapy</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="email" className="text-right">
                  Email
                </Label>
                <Input id="email" type="email" placeholder="john.smith@physioplus.com" className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="phone" className="text-right">
                  Phone
                </Label>
                <Input id="phone" type="tel" placeholder="555-123-4567" className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="startDate" className="text-right">
                  Start Date
                </Label>
                <Input id="startDate" type="date" className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="bio" className="text-right">
                  Bio
                </Label>
                <Textarea id="bio" placeholder="Brief professional bio" className="col-span-3" />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="submit"
                className="bg-indigo-600 hover:bg-indigo-700 text-white"
                onClick={() => {
                  toast({
                    title: "Employee added",
                    description: "New employee has been added successfully",
                  })
                }}
              >
                Add Employee
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog> */}
      </div>
    </DashboardLayout>
  )
}