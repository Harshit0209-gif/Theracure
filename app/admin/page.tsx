"use client"

import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

export default function AdminDashboard() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Clinic Overview */}
        <Card className="bg-blue-50">
          <CardHeader>
            <CardTitle>Clinic overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col">
              <div className="text-center mb-2">Total number of registered patients</div>
              <div className="flex justify-between items-end">
                <div className="flex flex-col items-center">
                  <div className="h-32 w-20 bg-green-500 relative">
                    <div className="absolute -top-6 left-0 right-0 text-center text-xs">
                      <div>20</div>
                      <div>Male: 12</div>
                      <div>Female: 8</div>
                    </div>
                  </div>
                  <div className="text-xs mt-1">Yesterday</div>
                </div>

                <div className="flex flex-col items-center">
                  <div className="h-40 w-20 bg-red-500 relative">
                    <div className="absolute -top-6 left-0 right-0 text-center text-xs">
                      <div>46</div>
                      <div>Male: 20</div>
                      <div>Female: 26</div>
                    </div>
                  </div>
                  <div className="text-xs mt-1">Today</div>
                </div>

                <div className="flex flex-col items-center">
                  <div className="h-36 w-20 bg-blue-500 relative">
                    <div className="absolute -top-6 left-0 right-0 text-center text-xs">
                      <div>22</div>
                      <div>Male: 10</div>
                      <div>Female: 12</div>
                    </div>
                  </div>
                  <div className="text-xs mt-1">Tomorrow</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Active Therapists */}
        <Card className="bg-blue-50">
          <CardHeader>
            <CardTitle>Number of active therapists</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="w-32 h-32 rounded-full border-8 border-green-500 border-r-red-500"></div>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <span>Active</span>
                  <span className="bg-green-500 text-white px-4 py-1 rounded-md">2</span>
                </div>
                <div className="flex items-center gap-4">
                  <span>Deactive</span>
                  <span className="bg-red-500 text-white px-4 py-1 rounded-md">4</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

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

        {/* Upcoming Sessions */}
        <Card className="bg-blue-50">
          <CardHeader>
            <CardTitle>Upcoming Sessions</CardTitle>
          </CardHeader>
          <CardContent>{/* Content will be added here */}</CardContent>
        </Card>

        {/* Pending Invoices */}
        <Card className="bg-blue-50">
          <CardHeader>
            <CardTitle>Pending Invoices</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="w-32 h-32 rounded-full border-8 border-red-500 border-b-green-500"></div>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <span>Settled payments</span>
                  <div className="w-16 h-6 bg-green-500"></div>
                </div>
                <div className="flex items-center gap-4">
                  <span>Unsettled payments</span>
                  <div className="w-16 h-6 bg-red-500"></div>
                </div>
              </div>
            </div>
            <div className="flex justify-end mt-4">
              <Button variant="outline" className="rounded-full">
                Details
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
