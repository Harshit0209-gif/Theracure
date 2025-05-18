"use client"

import { Button } from "@/components/ui/button"

export function InvoicesSection() {
  return (
    <div className="bg-gray-200 rounded-lg p-6 mb-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-800">Invoices</h2>
      </div>

      <div className="space-y-4">
        <div className="rounded-lg p-4 flex justify-center">
          <Button className="bg-blue-300 hover:bg-blue-400 text-gray-800 font-medium px-8">Generate New Invoice</Button>
        </div>

        <div className="rounded-lg p-4 flex justify-center">
          <Button className="bg-blue-300 hover:bg-blue-400 text-gray-800 font-medium px-8">All Invoices</Button>
        </div>
      </div>
    </div>
  )
}
