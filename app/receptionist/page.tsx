"use client"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { StatsSection } from "@/components/stats/stats-section"
import { InvoicesSection } from "@/components/invoices/invoices-section"
import { ClientManagementSection } from "@/components/clients/client-management-section"
import { useAuth } from "@/contexts/auth-context"


import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

export default function Dashboard() {
  const { user } = useAuth()

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl font-semibold text-gray-800 mb-6">Good Morning, {user?.name || "User"}</h1>

          {/* Stats Section */}
          <StatsSection />

          {/* Appointments Today */}
        <Card className="bg-blue-50">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Appointments Today</CardTitle>
            <div className="bg-gray-200 p-4 rounded-md">
              <div className="text-3xl font-bold text-center">46</div>
              <div className="text-sm text-center">patients</div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Details</h3>
                <div className="w-64">
                  <Input
                    placeholder="Search by patient name"
                    className="bg-blue-900 text-white placeholder:text-gray-300"
                  />
                </div>
              </div>

              <Table>
                <TableHeader className="bg-blue-900 text-white">
                  <TableRow>
                    <TableHead className="text-white">Patient Name</TableHead>
                    <TableHead className="text-white">Assigned Doctor</TableHead>
                    <TableHead className="text-white">Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[1, 2, 3].map((i) => (
                    <TableRow key={i} className="bg-gray-200">
                      <TableCell>Mr. Rohan Mondal</TableCell>
                      <TableCell>Dr. Mainak Sur</TableCell>
                      <TableCell>4.00 pm</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

          {/* Invoices Section */}
          <InvoicesSection />

          {/* Client Management Section */}
          <ClientManagementSection />
        </div>
      </div>
    </DashboardLayout>
  )
}
