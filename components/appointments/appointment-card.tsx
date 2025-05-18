import { Clock } from "lucide-react"
import { ChevronRight } from "lucide-react"

interface AppointmentCardProps {
  patientName: string
  doctorName: string
  time: string
}

export function AppointmentCard({ patientName, doctorName, time }: AppointmentCardProps) {
  return (
    <div className="flex items-center justify-between bg-blue-200 rounded-full p-4 mb-4">
      <div className="font-medium text-gray-800">{patientName}</div>
      <div className="flex items-center">
        <ChevronRight className="h-6 w-6 mx-4 text-white" />
      </div>
      <div className="font-medium text-gray-800">{doctorName}</div>
      <div className="flex items-center bg-white rounded-full p-2">
        <Clock className="h-5 w-5 text-indigo-600 mr-2" />
        <span className="font-medium">{time}</span>
      </div>
    </div>
  )
}
