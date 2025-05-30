import { useState, useCallback } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { createUserSchema } from "@/lib/validations/user"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Plus, Eye, EyeOff, Filter } from "lucide-react"
import { toast } from "@/components/ui/use-toast"

type FormData = z.infer<typeof createUserSchema>

interface AddEmployeeDialogProps {
  onUserCreated: () => void
}

export function AddEmployeeDialog({ onUserCreated }: AddEmployeeDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [phoneValue, setPhoneValue] = useState("")
  const [showPassword, setShowPassword] = useState(false)

  const form = useForm<FormData>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      role: "therapist",
      password: "",
    },
  })

  const formatPhoneNumber = useCallback((value: string) => {
    const digits = value.replace(/\D/g, "")
    
    if (digits.length <= 3) {
      return digits
    } else if (digits.length <= 6) {
      return `${digits.slice(0, 3)}-${digits.slice(3)}`
    } else if (digits.length <= 10) {
      return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`
    } else {
      return `+${digits.slice(0, 1)} ${digits.slice(1, 4)}-${digits.slice(4, 7)}-${digits.slice(7, 11)}`
    }
  }, [])

  const handlePhoneChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value)
    setPhoneValue(formatted)
    form.setValue("phone", formatted)
  }, [form, formatPhoneNumber])

  async function onSubmit(data: FormData) {
    try {
      setIsLoading(true)
      const response = await fetch("/api/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "Failed to create employee")
      }

      toast({
        title: "Employee added successfully",
        description: "New employee has been added to the system.",
      })
      
      form.reset()
      setPhoneValue("")
      setIsDialogOpen(false)
      onUserCreated() // Refresh the users list
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create employee",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex gap-2">
      <Button variant="outline" size="sm" className="flex items-center gap-1 border-indigo-600 text-indigo-700 hover:bg-indigo-50">
        <Filter className="h-4 w-4" />
        Filter
      </Button>
      
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <Button size="sm" className="flex items-center gap-1 bg-indigo-600 hover:bg-indigo-700 text-white">
            <Plus className="h-4 w-4" />
            Add Employee
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Add New Employee</DialogTitle>
            <DialogDescription>Add a new employee to the system. Fill in all the required details.</DialogDescription>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Full Name
              </Label>
              <Input
                id="name"
                placeholder="Dr. John Smith"
                className="col-span-3"
                {...form.register("name")}
              />
              {form.formState.errors.name && (
                <p className="col-span-3 col-start-2 text-sm text-red-500">
                  {form.formState.errors.name.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="role" className="text-right">
                Role
              </Label>
              <Select
                onValueChange={(value) => form.setValue("role", value as any)}
                defaultValue={form.getValues("role")}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="therapist">Therapist</SelectItem>
                  <SelectItem value="admin">Administrator</SelectItem>
                  <SelectItem value="receptionist">Receptionist</SelectItem>
                  <SelectItem value="content_manager">Content Manager</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="john.smith@physioplus.com"
                className="col-span-3"
                {...form.register("email")}
              />
              {form.formState.errors.email && (
                <p className="col-span-3 col-start-2 text-sm text-red-500">
                  {form.formState.errors.email.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="phone" className="text-right">
                Phone
              </Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+1 234-567-890"
                className="col-span-3"
                value={phoneValue}
                onChange={handlePhoneChange}
                onBlur={() => {
                  if (phoneValue && !phoneValue.startsWith("+")) {
                    setPhoneValue("+" + phoneValue)
                    form.setValue("phone", "+" + phoneValue)
                  }
                }}
              />
              {form.formState.errors.phone && (
                <p className="col-span-3 col-start-2 text-sm text-red-500">
                  {form.formState.errors.phone.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="password" className="text-right">
                Password
              </Label>
              <div className="col-span-3 relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="********"
                  className="pr-10"
                  {...form.register("password")}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-500" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-500" />
                  )}
                  <span className="sr-only">
                    {showPassword ? "Hide password" : "Show password"}
                  </span>
                </Button>
              </div>
              {form.formState.errors.password && (
                <p className="col-span-3 col-start-2 text-sm text-red-500">
                  {form.formState.errors.password.message}
                </p>
              )}
            </div>

            <DialogFooter>
              <Button
                type="submit"
                className="bg-indigo-600 hover:bg-indigo-700 text-white"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Adding Employee...
                  </div>
                ) : (
                  "Add Employee"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}