"use client"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { AddPatientForm } from "./add-patient-form"
import { Plus } from "lucide-react"

export function AddPatientDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button><Plus className="h-4 w-4" />
             New Patient</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Patient</DialogTitle>
        </DialogHeader>
        <AddPatientForm />
      </DialogContent>
    </Dialog>
  )
} 