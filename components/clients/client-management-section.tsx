"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Search } from "lucide-react"

interface Client {
  id: number
  name: string
  uid: string
}

export function ClientManagementSection() {
  const [searchQuery, setSearchQuery] = useState("")

  // Sample client data
  const clients: Client[] = [
    { id: 1, name: "Rohan Mondal", uid: "987523652" },
    { id: 2, name: "Rohan Mondal", uid: "987523652" },
  ]

  return (
    <div className="bg-gray-200 rounded-lg p-6 mb-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-800">Client Management System</h2>
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

      <div className="bg-blue-200 rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-indigo-700">
              <TableHead className="font-semibold text-white">Sl. No</TableHead>
              <TableHead className="font-semibold text-white">Clients Name</TableHead>
              <TableHead className="font-semibold text-white">UID NO</TableHead>
              <TableHead className="font-semibold text-white">Details</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {clients.map((client, index) => (
              <TableRow key={client.id} className="hover:bg-transparent !hover:bg-transparent">
                <TableCell>{index + 1}</TableCell>
                <TableCell>{client.name}</TableCell>
                <TableCell>{client.uid}</TableCell>
                <TableCell>
                  <Button variant="link" className="text-indigo-700 hover:text-indigo-900 p-0">
                    Details
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
