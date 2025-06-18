import {
  UserPlus,
  Users,
  Calendar,
  CalendarCheck,
  Handshake,
  DollarSign,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export function StatsSection() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <Card className="bg-white shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">
                Total Patients
              </p>
              <h3 className="text-2xl font-bold mt-1">1,234</h3>
              <p className="text-xs text-green-500 mt-1">
                ↑ 12% from last month
              </p>
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
              <p className="text-sm font-medium text-gray-500">
                Today's Consultaions
              </p>
              <h3 className="text-2xl font-bold mt-1">12</h3>
              <p className="text-xs text-green-500 mt-1">↑ 2 new this week</p>
            </div>
            <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
              <Handshake className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">
                Today's Sessions
              </p>
              <h3 className="text-2xl font-bold mt-1">46</h3>
              <p className="text-xs text-blue-500 mt-1">8 pending</p>
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
              <p className="text-sm font-medium text-gray-500">
                Pending Payments
              </p>
              <h3 className="text-2xl font-bold mt-1">$24,500</h3>
              <p className="text-xs text-red-500 mt-1">
                20 Invoices pending completion
              </p>
            </div>
            <div className="h-12 w-12 bg-orange-100 rounded-full flex items-center justify-center">
              <DollarSign className="h-6 w-6 text-orange-600" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
