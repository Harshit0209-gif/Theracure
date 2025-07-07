import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/contexts/auth-context";
import {
  createPatientSchema,
  type PatientFormData,
} from "@/lib/validations/patient";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast";

type AddPatientDialogProps = {
  fetchPatients: () => void;
};

export const AddPatientDialog = ({ fetchPatients }: AddPatientDialogProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const { user } = useAuth();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    reset,
  } = useForm<PatientFormData>({
    resolver: zodResolver(createPatientSchema),
  });

  const onSubmit = async (data: PatientFormData) => {
    console.log("user ", user);
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to add a patient",
        variant: "destructive",
      });
      return;
    }

    const payload = {
      ...data,
      createdBy: user.email,
    };

    console.log("onSubmit called with payload: ", payload);

    try {
      setIsLoading(true);
      const response = await fetch("/api/patients", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to add patient");
      }

      toast({
        title: "Success",
        description: "Patient added successfully",
      });
      reset();
      setOpen(false);
      fetchPatients();
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to add patient",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4" />
          New Patient
        </Button>
      </DialogTrigger>
      <DialogContent
        onClose={() => reset()}
        className="w-full max-w-6xl max-h-[95vh] overflow-y-auto p-0"
      >
        <div className="p-6">
          <DialogHeader className="mb-6">
            <DialogTitle className="text-2xl font-semibold text-gray-900">
              New Patient Registration
            </DialogTitle>
          </DialogHeader>

          {Object.keys(errors).length > 0 && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md mb-6">
              <p className="text-sm font-medium">
                Please correct the errors below to continue ,
              </p>
            </div>
          )}

          <form
            onSubmit={handleSubmit(onSubmit, (errors) => {
              console.log("Form submission failed with errors:", errors);
            })}
            className="space-y-8"
          >
            {/* Basic Information Section */}
            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                <span className="w-2 h-2 bg-indigo-600 rounded-full mr-3"></span>
                Basic Information
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    {...register("patientName")}
                    placeholder="Enter patient name"
                    className="w-full"
                  />
                  {errors.patientName && (
                    <p className="text-xs text-red-500">
                      {errors.patientName.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    {...register("email")}
                    placeholder="Enter email address"
                    className="w-full"
                  />
                  {errors.email && (
                    <p className="text-xs text-red-500">
                      {errors.email.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    {...register("phone")}
                    placeholder="Enter 10-digit phone number"
                    className="w-full"
                  />
                  {errors.phone && (
                    <p className="text-xs text-red-500">
                      {errors.phone.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gender">Gender *</Label>
                  <Controller
                    name="gender"
                    control={control}
                    render={({ field }) => (
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Male">Male</SelectItem>
                          <SelectItem value="Female">Female</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.gender && (
                    <p className="text-xs text-red-500">
                      {errors.gender.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-6">
                <div className="space-y-2">
                  <Label htmlFor="address">Address *</Label>
                  <Textarea
                    id="address"
                    {...register("address")}
                    placeholder="Enter complete address"
                    rows={2}
                    className="w-full resize-none"
                  />
                  {errors.address && (
                    <p className="text-xs text-red-500">
                      {errors.address.message}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Health Profile Section */}
            <div className="bg-blue-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                <span className="w-2 h-2 bg-blue-600 rounded-full mr-3"></span>
                Health Profile
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="age">Age</Label>
                  <Input
                    id="age"
                    type="number"
                    min="0"
                    max="120"
                    {...register("age", { valueAsNumber: true })}
                    placeholder="Enter age"
                    className="w-full"
                  />
                  {errors.age && (
                    <p className="text-xs text-red-500">{errors.age.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="height">Height (cm)</Label>
                  <Input
                    id="height"
                    type="number"
                    min="50"
                    max="250"
                    {...register("height", { valueAsNumber: true })}
                    placeholder="Height in cm"
                    className="w-full"
                  />
                  {errors.height && (
                    <p className="text-xs text-red-500">
                      {errors.height.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="weight">Weight (kg)</Label>
                  <Input
                    id="weight"
                    type="number"
                    min="1"
                    max="300"
                    step="0.1"
                    {...register("weight", { valueAsNumber: true })}
                    placeholder="Weight in kg"
                    className="w-full"
                  />
                  {errors.weight && (
                    <p className="text-xs text-red-500">
                      {errors.weight.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-6">
                <div className="space-y-2">
                  <Label htmlFor="medicalHistory">
                    Medical History (Optional)
                  </Label>
                  <Textarea
                    id="medicalHistory"
                    {...register("medicalHistory")}
                    placeholder="Enter medical history"
                    rows={3}
                    className="w-full resize-none"
                  />
                  {errors.medicalHistory && (
                    <p className="text-xs text-red-500">
                      {errors.medicalHistory.message}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end items-center pt-6 border-t border-gray-200 gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                className="px-6 py-2"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className="bg-indigo-600 hover:bg-indigo-700 px-8 py-2 min-w-[160px]"
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                    Adding...
                  </div>
                ) : (
                  "Add Patient"
                )}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
};
