"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { AppointmentCard } from "@/components/appointments/appointment-card"
import { Search } from "lucide-react"
import { AppointmentForm } from "@/components/appointments/appointment-form"

interface Appointment {
  id: number
  patientName: string
  doctorName: string
  time: string
}

export function AppointmentsSection() {
  const [date, setDate] = useState("05/04/2025")
  const [searchQuery, setSearchQuery] = useState("")
  const [isFormOpen, setIsFormOpen] = useState(false)

  // Sample appointment data
  const appointments: Appointment[] = [
    { id: 1, patientName: "Rohan Mondal", doctorName: "Dr. Mainak Sur", time: "4:30 pm" },
    { id: 2, patientName: "Rohan Mondal", doctorName: "Dr. Mainak Sur", time: "4:30 pm" },
    { id: 3, patientName: "Rohan Mondal", doctorName: "Dr. Mainak Sur", time: "4:30 pm" },
  ]

  return (
    <div className="bg-gray-200 rounded-lg p-6 mb-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
        <h2 className="text-xl font-semibold text-gray-800">Appointments</h2>
        <div className="flex items-center space-x-4">
          <Button className="bg-indigo-900 hover:bg-indigo-800">Date - {date}</Button>
        </div>
      </div>

      <div className="flex justify-between mb-6">
        <Button className="bg-indigo-700 hover:bg-indigo-800" onClick={() => setIsFormOpen(true)}>
          Create new Appointments +
        </Button>
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search by client name"
            className="bg-white pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
        {appointments.map((appointment) => (
          <AppointmentCard
            key={appointment.id}
            patientName={appointment.patientName}
            doctorName={appointment.doctorName}
            time={appointment.time}
          />
        ))}
      </div>

      <div className="flex justify-center mt-4">
        <Button variant="outline" className="bg-indigo-900 text-white hover:bg-indigo-800">
          More
        </Button>
      </div>

      <AppointmentForm isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} />
    </div>
  )
}
