"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Search, Plus, ChevronLeft, ChevronRight } from "lucide-react"

interface Patient {
  id: number
  name: string
  uid: string
}

export function PatientManagementSection() {
  const [searchQuery, setSearchQuery] = useState("")
  // More dummy patient data
  const Patients: Patient[] = [
    { id: 1, name: "Rohan Mondal", uid: "987523652" },
    { id: 2, name: "Priya Sharma", uid: "987523653" },
    { id: 3, name: "Amit Kumar", uid: "987523654" },
    { id: 4, name: "Sneha Das", uid: "987523655" },
    { id: 5, name: "Rahul Singh", uid: "987523656" },
    { id: 6, name: "Anjali Verma", uid: "987523657" },
    { id: 7, name: "Vikram Patel", uid: "987523658" },
    { id: 8, name: "Meera Joshi", uid: "987523659" },
    { id: 9, name: "Suresh Gupta", uid: "987523660" },
    { id: 10, name: "Neha Kapoor", uid: "987523661" },
  ]

  // Pagination logic
  const [page, setPage] = useState(1)
  const pageSize = 5
  const totalPages = Math.ceil(Patients.length / pageSize)
  const paginatedPatients = Patients.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  ).slice((page - 1) * pageSize, page * pageSize)

  return (
    <div className="bg-gray-200 rounded-lg p-6 mb-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-800">Patient Management System</h2>
        <div className="flex gap-2">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-indigo-400 h-4 w-4" />
            <Input
              placeholder="Search by Patient name"
              className="bg-white pl-10 border border-indigo-300 rounded-lg text-sm placeholder:text-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button className="bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-1">
            <Plus className="h-4 w-4" />
            New Patient
          </Button>
        </div>
      </div>

      <div className="bg-blue-200 rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-indigo-700">
              <TableHead className="font-semibold text-white">Sl. No</TableHead>
              <TableHead className="font-semibold text-white">Patients Name</TableHead>
              <TableHead className="font-semibold text-white">UID NO</TableHead>
              <TableHead className="font-semibold text-white">Details</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedPatients.map((Patient, index) => (
              <TableRow key={Patient.id} className="hover:bg-transparent !hover:bg-transparent">
                <TableCell>{(page - 1) * pageSize + index + 1}</TableCell>
                <TableCell>{Patient.name}</TableCell>
                <TableCell>{Patient.uid}</TableCell>
                <TableCell>
                  <Button variant="link" className="text-indigo-700 hover:text-indigo-900 p-0">
                    Details
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {/* Pagination Controls */}
        <div className="flex justify-between items-center p-4 bg-blue-100 border-t border-blue-300">
          <span className="text-sm text-gray-700">
            Page {page} of {totalPages}
          </span>
          <div className="flex gap-2 items-center">
            <Button
              size="icon"
              variant="outline"
              className="border-indigo-600 text-indigo-700 hover:bg-indigo-50"
              disabled={page === 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            {/* Page Numbers */}
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
            <Button
              size="icon"
              variant="outline"
              className="border-indigo-600 text-indigo-700 hover:bg-indigo-50"
              disabled={page === totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
