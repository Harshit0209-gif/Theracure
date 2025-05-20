"use client"

import { useState } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Search, Accessibility, CalendarCheck2, Plus, CalendarDays, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"

const appointmentData = [
  { id: 1, patient: "Mr. Rohan Mondal", doctor: "Dr. Mainak Sur", status: "Not Assigned", time: "4.00 pm" },
  { id: 2, patient: "Mr. Rohan Mondal", doctor: "Dr. Mainak Sur", status: "Assigned", time: "4.00 pm" },
  { id: 3, patient: "Mr. Rohan Mondal", doctor: "Dr. Mainak Sur", status: "Done", time: "4.00 pm" },
  { id: 4, patient: "Ms. Priya Sharma", doctor: "Dr. Mainak Sur", status: "Assigned", time: "5.00 pm" },
  { id: 5, patient: "Mr. Amit Kumar", doctor: "Dr. Mainak Sur", status: "Not Assigned", time: "5.30 pm" },
  { id: 6, patient: "Ms. Sneha Das", doctor: "Dr. Mainak Sur", status: "Done", time: "6.00 pm" },
]

const statusColor: Record<string, string> = {
  "Not Assigned": "text-red-600 font-semibold",
  "Assigned": "text-green-600 font-semibold",
  "Done": "text-indigo-700 font-semibold"
}

const Appointment = () => {
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const pageSize = 3
  const filtered = appointmentData.filter(a => a.patient.toLowerCase().includes(search.toLowerCase()))
  const totalPages = Math.ceil(filtered.length / pageSize)
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize)

  return (
    <DashboardLayout>
      <div className="bg-gray-200 rounded-lg p-6 mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold mb-1 text-gray-800">Appointment Management</h1>
            {/* <div className="text-lg text-gray-600 font-medium">Today's Appointment</div> */}
          </div>
          {/* Action buttons below search/patient count */}
          <div className="flex gap-2 w-full md:w-auto justify-end px-4 pt-4 pb-0">
              <Button className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 py-2 rounded-lg flex items-center gap-2">
                <CalendarCheck2 className="h-5 w-5" />
                Manage Appointments
              </Button>
              <Button className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 py-2 rounded-lg flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Schedule New
              </Button>
              <Button className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 py-2 rounded-lg flex items-center gap-2">
                <CalendarDays className="h-5 w-5" />
                View Calendar
              </Button>
            </div>
        </div>
        <div className="bg-blue-200 rounded-lg overflow-hidden mb-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 p-4 pb-0 mb-6">
            {/* Search bar on the left */}
            <div className="flex-1 flex items-center">
              <div className="relative w-full md:w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-indigo-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Search by patient name"
                  className="pl-10 pr-4 py-2 bg-white border border-indigo-300 rounded-lg w-full text-sm placeholder:text-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                  value={search}
                  onChange={e => { setSearch(e.target.value); setPage(1); }}
                />
              </div>
            </div>
            {/* Patient count card on the right */}
            <div className="flex items-center gap-3 bg-white rounded-lg px-4 py-2 shadow min-w-[160px] justify-end">
              <Accessibility className="h-8 w-8 text-indigo-700" />
              <div className="flex flex-col items-center ">
                <span className="text-2xl font-bold text-indigo-700">46</span>
                <span className="text-gray-700 text-sm">patients</span>
              </div>
            </div>
            
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full rounded-lg">
              <thead>
                <tr className="bg-indigo-700">
                  <th className="px-4 py-2 text-left text-white font-semibold">Patient Name</th>
                  <th className="px-4 py-2 text-left text-white font-semibold">Assigned Doctor</th>
                  <th className="px-4 py-2 text-left text-white font-semibold">Activity</th>
                  <th className="px-4 py-2 text-left text-white font-semibold">Time</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((a) => (
                  <tr key={a.id} className="bg-gray-100 border-b last:border-b-0">
                    <td className="px-4 py-2">{a.patient}</td>
                    <td className="px-4 py-2">{a.doctor}</td>
                    <td className={`px-4 py-2 ${statusColor[a.status as keyof typeof statusColor]}`}>{a.status}</td>
                    <td className="px-4 py-2 font-semibold">{a.time}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
    </DashboardLayout>
  )
}

export default Appointment;