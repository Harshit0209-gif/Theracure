"use client"

import { useState } from "react"
import {
  Plus,
  CreditCard,
  Clock,
  DollarSign,
  Filter,
  Download,
  Printer,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
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
import { useToast } from "@/components/ui/use-toast"

const invoices = [
  {
    id: "INV-2023-001",
    patient: "John Smith",
    date: "26 Jul 2023",
    amount: "$150",
    status: "Paid",
    items: [
      { description: "Manual Therapy (2 sessions)", amount: "$120" },
      { description: "Medical Supplies", amount: "$30" },
    ],
  },
  {
    id: "INV-2023-002",
    patient: "Emily Davis",
    date: "25 Jul 2023",
    amount: "$320",
    status: "Paid",
    items: [
      { description: "Exercise Therapy (4 sessions)", amount: "$280" },
      { description: "Medical Supplies", amount: "$40" },
    ],
  },
  {
    id: "INV-2023-003",
    patient: "Robert Wilson",
    date: "24 Jul 2023",
    amount: "$85",
    status: "Pending",
    items: [
      { description: "Electrotherapy (1 session)", amount: "$75" },
      { description: "Medical Supplies", amount: "$10" },
    ],
  },
  {
    id: "INV-2023-004",
    patient: "Maria Garcia",
    date: "23 Jul 2023",
    amount: "$210",
    status: "Paid",
    items: [
      { description: "Hydrotherapy (3 sessions)", amount: "$180" },
      { description: "Medical Supplies", amount: "$30" },
    ],
  },
  {
    id: "INV-2023-005",
    patient: "David Lee",
    date: "22 Jul 2023",
    amount: "$120",
    status: "Pending",
    items: [
      { description: "Manual Therapy (1 session)", amount: "$100" },
      { description: "Medical Supplies", amount: "$20" },
    ],
  },
  {
    id: "INV-2023-006",
    patient: "Sophia Brown",
    date: "21 Jul 2023",
    amount: "$180",
    status: "Paid",
    items: [
      { description: "Exercise Therapy (2 sessions)", amount: "$160" },
      { description: "Medical Supplies", amount: "$20" },
    ],
  },
  {
    id: "INV-2023-007",
    patient: "James Miller",
    date: "20 Jul 2023",
    amount: "$95",
    status: "Pending",
    items: [
      { description: "Electrotherapy (1 session)", amount: "$85" },
      { description: "Medical Supplies", amount: "$10" },
    ],
  },
  {
    id: "INV-2023-008",
    patient: "Olivia Wilson",
    date: "19 Jul 2023",
    amount: "$250",
    status: "Paid",
    items: [
      { description: "Manual Therapy (3 sessions)", amount: "$210" },
      { description: "Medical Supplies", amount: "$40" },
    ],
  },
  {
    id: "INV-2023-009",
    patient: "Liam Martinez",
    date: "18 Jul 2023",
    amount: "$130",
    status: "Paid",
    items: [
      { description: "Hydrotherapy (1 session)", amount: "$110" },
      { description: "Medical Supplies", amount: "$20" },
    ],
  },
  {
    id: "INV-2023-010",
    patient: "Emma Anderson",
    date: "17 Jul 2023",
    amount: "$175",
    status: "Pending",
    items: [
      { description: "Exercise Therapy (2 sessions)", amount: "$150" },
      { description: "Medical Supplies", amount: "$25" },
    ],
  },
]

export function InvoicesSection() {
  const { toast } = useToast()
  // Pagination state
  const [page, setPage] = useState(1)
  const pageSize = 5
  const totalPages = Math.ceil(invoices.length / pageSize)
  const paginatedInvoices = invoices.slice((page - 1) * pageSize, page * pageSize)

  return (
    <>
      <div className="bg-gray-200 rounded-lg p-6 mb-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-800">Billing System</h2>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="flex items-center gap-1 border-indigo-600 text-indigo-700 hover:bg-indigo-50">
              <Filter className="h-4 w-4" />
              Filter
            </Button>
            <Button variant="outline" size="sm" className="flex items-center gap-1 border-teal-600 text-teal-700 hover:bg-teal-50">
              <Download className="h-4 w-4" />
              Export
            </Button>
            
            <Dialog>
          <DialogTrigger asChild>
            <Button size="sm" className="flex items-center gap-1 bg-indigo-600 hover:bg-indigo-700 text-white">
              <Plus className="h-4 w-4" />
              New Invoice
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Create New Invoice</DialogTitle>
              <DialogDescription>Create a new invoice for a patient. Fill in all the required details.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="patient" className="text-right">
                  Patient
                </Label>
                <Select>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select patient" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="john">John Smith</SelectItem>
                    <SelectItem value="emily">Emily Davis</SelectItem>
                    <SelectItem value="robert">Robert Wilson</SelectItem>
                    <SelectItem value="maria">Maria Garcia</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="treatment" className="text-right">
                  Treatment
                </Label>
                <Select>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select treatment" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manual">Manual Therapy</SelectItem>
                    <SelectItem value="exercise">Exercise Therapy</SelectItem>
                    <SelectItem value="electro">Electrotherapy</SelectItem>
                    <SelectItem value="hydro">Hydrotherapy</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="date" className="text-right">
                  Date
                </Label>
                <Input id="date" type="date" className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="amount" className="text-right">
                  Amount
                </Label>
                <Input id="amount" type="number" placeholder="0.00" className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="description" className="text-right">
                  Description
                </Label>
                <Textarea id="description" placeholder="Invoice description" className="col-span-3" />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="submit"
                className="bg-teal-500 hover:bg-teal-600"
                onClick={() => {
                  toast({
                    title: "Invoice created",
                    description: "New invoice has been created successfully",
                  })
                }}
              >
                Create Invoice
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
                <CreditCard className="h-6 w-6 text-teal-500" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Revenue</p>
                <h3 className="text-2xl font-bold">$28,500</h3>
                <p className="text-xs text-green-600">+12% from last month</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center">
              <div className="bg-green-50 p-3 rounded-full mr-4">
                <DollarSign className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Paid Invoices</p>
                <h3 className="text-2xl font-bold">$22,800</h3>
                <p className="text-xs text-green-600">80% of total</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center">
              <div className="bg-amber-50 p-3 rounded-full mr-4">
                <Clock className="h-6 w-6 text-amber-500" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Pending Payments</p>
                <h3 className="text-2xl font-bold">$5,700</h3>
                <p className="text-xs text-amber-600">20% of total</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="bg-white rounded-b-lg overflow-hidden mb-6">
          <Table>
            <TableHeader>
              <TableRow className="bg-indigo-700">
                <TableHead className="font-semibold text-white">Invoice ID</TableHead>
                <TableHead className="font-semibold text-white">Patient</TableHead>
                <TableHead className="font-semibold text-white">Date</TableHead>
                <TableHead className="font-semibold text-white">Amount</TableHead>
                <TableHead className="font-semibold text-white">Status</TableHead>
                <TableHead className="font-semibold text-white text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedInvoices.map((invoice) => (
                <TableRow key={invoice.id} className="hover:bg-transparent !hover:bg-transparent">
                  <TableCell>{invoice.id}</TableCell>
                  <TableCell>{invoice.patient}</TableCell>
                  <TableCell>{invoice.date}</TableCell>
                  <TableCell>{invoice.amount}</TableCell>
                  <TableCell>
                    <Badge variant={invoice.status === "Paid" ? "success" : "warning"}>{invoice.status}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => {
                            toast({
                              title: "Invoice details",
                              description: `Viewing details for invoice ${invoice.id}`,
                            })
                          }}
                        >
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            toast({
                              title: "Invoice printed",
                              description: `Invoice ${invoice.id} sent to printer`,
                            })
                          }}
                        >
                          <Printer className="h-4 w-4 mr-2" />
                          Print
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            toast({
                              title: "Invoice downloaded",
                              description: `Invoice ${invoice.id} downloaded as PDF`,
                            })
                          }}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => {
                            toast({
                              title: "Payment reminder sent",
                              description: `Reminder sent to ${invoice.patient}`,
                            })
                          }}
                        >
                          Send Reminder
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {/* Numbered Pagination Controls */}
          <div className="flex justify-between items-center p-4 bg-white border-t">
            <span className="text-sm text-gray-700">
              Page {page} of {totalPages}
            </span>
            <div className="flex gap-2 items-center">
              <Button
                size="sm"
                variant="outline"
                className="border-indigo-600 text-indigo-700 hover:bg-indigo-50"
                disabled={page === 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                <ChevronLeft className="h-4 w-4" />Previous
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

        
      </div>
    </>
  )
}
