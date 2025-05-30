import { Card, CardContent } from "@/components/ui/card"
import { UserCog, Stethoscope, Briefcase } from "lucide-react"

interface StatsProps {
  stats: {
    total: number
    therapists: number
    support: number
  }
}

export function EmployeeStats({ stats }: StatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <Card>
        <CardContent className="p-4 flex items-center">
          <div className="bg-teal-50 p-3 rounded-full mr-4">
            <UserCog className="h-6 w-6 text-teal-500" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Total Employees</p>
            <h3 className="text-2xl font-bold">{stats.total}</h3>
            <p className="text-xs text-green-600">Active users</p>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-4 flex items-center">
          <div className="bg-blue-50 p-3 rounded-full mr-4">
            <Stethoscope className="h-6 w-6 text-blue-500" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Therapists</p>
            <h3 className="text-2xl font-bold">{stats.therapists}</h3>
            <p className="text-xs text-blue-600">
              {stats.total > 0 ? Math.round((stats.therapists / stats.total) * 100) : 0}% of staff
            </p>
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
            <h3 className="text-2xl font-bold">{stats.support}</h3>
            <p className="text-xs text-amber-600">
              {stats.total > 0 ? Math.round((stats.support / stats.total) * 100) : 0}% of staff
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
