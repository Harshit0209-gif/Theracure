"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/auth-context";
import { Plus } from "lucide-react";
import { useState } from "react";
import {
  consulationSchema,
  ConsultationFormData,
} from "@/lib/validations/consulation";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { toast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Consultation } from "@/lib/generated/userRoles";

type AddConsultationDialogProps = {
  onAdd: (consultation: Consultation) => void;
};

const availableTherapist = [
  { value: "Dr. Mainak Sur (PT)", label: "Dr. Mainak Sur (PT)" },
  { value: "Dr. Diksha Palit (PT)", label: "Dr. Diksha Palit (PT)" },
  { value: "Dr. Diptesh Dey (PT)", label: "Dr. Diptesh Dey (PT)" },
];

export function AddConsultationDialog({ onAdd }: AddConsultationDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogBoxOpen, setIsDialogBoxOpen] = useState(false);

  const { user } = useAuth();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    reset,
  } = useForm<ConsultationFormData>({
    resolver: zodResolver(consulationSchema),
  });

  const onSubmit = async (data: ConsultationFormData) => {
    setIsLoading(true);
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
      createdById: user.email,
    };

    try {
      const response = await fetch("/api/consultations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        toast({
          title: "Error",
          description: "Failed to add Data. Please try again.",
          variant: "destructive",
        });
        throw new Error(response.statusText);
      }
      const responseData = await response.json();
      console.log("Response from API:", responseData);
      onAdd(responseData.data);
      toast({
        title: "Success",
        description: "Registration successfully",
      });

      reset();
      setIsDialogBoxOpen(false);
    } catch (error) {
      console.error("Error adding patient:", error);
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
    <Dialog open={isDialogBoxOpen} onOpenChange={setIsDialogBoxOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4" />
          New Consultation
        </Button>
      </DialogTrigger>
      <DialogContent
        onClose={() => reset()}
        className="w-full max-w-6xl max-h-[95vh] overflow-y-auto p-0"
      >
        <div className="p-6">
          <DialogHeader className="mb-6">
            <DialogTitle className="text-2xl font-semibold text-gray-900">
              New Consultation Registration
            </DialogTitle>
          </DialogHeader>

          {Object.keys(errors).length > 0 && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md mb-6">
              <p className="text-sm font-medium">
                Please correct the errors below to continue
              </p>
            </div>
          )}

          <form
            onSubmit={handleSubmit(onSubmit, (errors) => {
              console.log("Validation failed. Errors: ", errors);
            })}
            className="space-y-8"
          >
            {/* Personal Information Section */}
            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                <span className="w-2 h-2 bg-indigo-600 rounded-full mr-3"></span>
                Personal Information
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                <div className="space-y-2">
                  <Label
                    htmlFor="name"
                    className="text-sm font-medium text-gray-700"
                  >
                    Full Name *
                  </Label>
                  <Input
                    id="name"
                    {...register("name")}
                    placeholder="Enter patient name"
                    className="w-full"
                  />
                  {errors.name && (
                    <p className="text-xs text-red-500">
                      {errors.name.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="email"
                    className="text-sm font-medium text-gray-700"
                  >
                    Email Address
                  </Label>
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
                  <Label
                    htmlFor="phone"
                    className="text-sm font-medium text-gray-700"
                  >
                    Phone Number *
                  </Label>
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
                  <Label
                    htmlFor="gender"
                    className="text-sm font-medium text-gray-700"
                  >
                    Gender *
                  </Label>
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
                          <SelectItem value="male">Male</SelectItem>
                          <SelectItem value="female">Female</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
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
                  <Label
                    htmlFor="address"
                    className="text-sm font-medium text-gray-700"
                  >
                    Complete Address *
                  </Label>
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

            {/* Consultation Details Section */}
            <div className="bg-blue-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                <span className="w-2 h-2 bg-blue-600 rounded-full mr-3"></span>
                Consultation Details
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label
                    htmlFor="consultationwith"
                    className="text-sm font-medium text-gray-700"
                  >
                    Consultation With *
                  </Label>
                  <Controller
                    name="consultationwith"
                    control={control}
                    render={({ field }) => (
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select a Therapist" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableTherapist.map((therapist) => (
                            <SelectItem
                              key={therapist.value}
                              value={therapist.value}
                            >
                              {therapist.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.consultationwith && (
                    <p className="text-xs text-red-500">
                      {errors.consultationwith.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="consultationDate"
                    className="text-sm font-medium text-gray-700"
                  >
                    Consultation Date *
                  </Label>
                  <Input
                    id="consultationDate"
                    type="date"
                    {...register("consultationDate")}
                    min={new Date().toISOString().split("T")[0]}
                    className="w-full"
                  />
                  {errors.consultationDate && (
                    <p className="text-xs text-red-500">
                      {errors.consultationDate.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="consultationTime"
                    className="text-sm font-medium text-gray-700"
                  >
                    Consultation Time *
                  </Label>
                  <Input
                    id="consultationTime"
                    type="time"
                    {...register("consultationTime")}
                    className="w-full"
                  />
                  {errors.consultationTime && (
                    <p className="text-xs text-red-500">
                      {errors.consultationTime.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-6">
                <div className="space-y-2">
                  <Label
                    htmlFor="note"
                    className="text-sm font-medium text-gray-700"
                  >
                    Additional Notes
                  </Label>
                  <Textarea
                    id="note"
                    {...register("note")}
                    placeholder="Any special requirements or additional information (optional)"
                    rows={3}
                    className="w-full resize-none"
                  />
                  {errors.note && (
                    <p className="text-xs text-red-500">
                      {errors.note.message}
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
                onClick={() => setIsDialogBoxOpen(false)}
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
                    Registering...
                  </div>
                ) : (
                  "Register Consultation"
                )}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
