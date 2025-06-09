"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/auth-context";
import { Calendar, Clock, Save, Plus, Trash2, Edit2Icon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

// Updated schema for day-wise availability
const availabilitySchema = z
  .object({
    weekDay: z.number().min(0).max(6, "Please select a valid day"), // 0-6 (Sunday-Saturday)
    startTime: z
      .string()
      .regex(
        /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
        "Time must be in HH:mm format"
      ),
    endTime: z
      .string()
      .regex(
        /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
        "Time must be in HH:mm format"
      ),
    isRecurring: z.boolean().default(true),
  })
  .refine((data) => data.startTime < data.endTime, {
    message: "End time must be after start time",
    path: ["endTime"],
  });

type AvailabilityFormData = z.infer<typeof availabilitySchema>;

const therapistSchema = z.object({
  specialization: z
    .string()
    .min(3, "Specialization is required")
    .or(z.literal("")),
  qualification: z.string().optional(),
});

type TherapistFormData = z.infer<typeof therapistSchema>;

interface Availability {
  id: string;
  weekDay: number;
  startTime: string;
  endTime: string;
  isRecurring: boolean;
  isAvailable: boolean;
  createdAt: string;
}

export default function TherapistProfile() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [availabilities, setAvailabilities] = useState<Availability[]>([]);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isAddAvailabilityOpen, setIsAddAvailabilityOpen] = useState(false);
  const [editingAvailability, setEditingAvailability] =
    useState<Availability | null>(null);

  const availabilityForm = useForm<AvailabilityFormData>({
    resolver: zodResolver(availabilitySchema),
    defaultValues: {
      weekDay: 1,
      startTime: "09:00",
      endTime: "17:00",
      isRecurring: true,
    },
  });

  const profileForm = useForm<TherapistFormData>({
    resolver: zodResolver(therapistSchema),
    defaultValues: {
      specialization: "",
    },
  });

  // Days mapping (0-6 for Sunday-Saturday)
  const daysOfWeek = [
    { value: 0, label: "Sunday" },
    { value: 1, label: "Monday" },
    { value: 2, label: "Tuesday" },
    { value: 3, label: "Wednesday" },
    { value: 4, label: "Thursday" },
    { value: 5, label: "Friday" },
    { value: 6, label: "Saturday" },
  ];

  useEffect(() => {
    if (user?.id) {
      fetchTherapistProfile();
      fetchAvailabilities();
    }
  }, [user?.id]);

  const fetchTherapistProfile = async () => {
    try {
      const response = await fetch(`/api/therapists/${user?.id}`);
      const data = await response.json();
      if (data.success) {
        profileForm.reset({
          specialization: data.therapist.specialization || "",
        });
      }
    } catch (error) {
      console.error("Error fetching therapist profile:", error);
    }
  };

  const fetchAvailabilities = async () => {
    try {
      const response = await fetch(`/api/therapists/${user?.id}/time-slots`);
      const data = await response.json();
      if (data.success) {
        setAvailabilities(data.timeSlots || []);
      }
    } catch (error) {
      console.error("Error fetching availabilities:", error);
    }
  };

  const onSubmitProfile = async (data: TherapistFormData) => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/therapists/${user?.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Failed to update profile");
      }

      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
      setIsEditingProfile(false);
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to update profile",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmitAvailability = async (data: AvailabilityFormData) => {
    console.log(data);
    try {
      setIsLoading(true);
      const response = await fetch(`/api/therapists/${user?.id}/time-slots`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to save time slot");
      }

      if (result.success) {
        toast({
          title: "Success",
          description: "Time slot added successfully",
        });
        setIsAddAvailabilityOpen(false);
        availabilityForm.reset();
        fetchAvailabilities();
      }
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to save time slot",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const deleteAvailability = async (slotId: string) => {
    try {
      const response = await fetch(
        `/api/therapists/${user?.id}/time-slots?slotId=${slotId}`,
        {
          method: "DELETE",
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to delete time slot");
      }

      if (result.success) {
        toast({
          title: "Success",
          description: "Time slot deleted successfully",
        });
        fetchAvailabilities();
      }
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to delete time slot",
        variant: "destructive",
      });
    }
  };

  const openEditDialog = (availability: Availability) => {
    setEditingAvailability(availability);
    availabilityForm.reset({
      weekDay: availability.weekDay,
      startTime: availability.startTime,
      endTime: availability.endTime,
      isRecurring: availability.isRecurring,
    });
    setIsAddAvailabilityOpen(true);
  };

  const openAddDialog = () => {
    availabilityForm.reset({
      weekDay: 1,
      startTime: "09:00",
      endTime: "17:00",
      isRecurring: true,
    });
    setIsAddAvailabilityOpen(true);
  };

  const handleDayChange = (dayValue: string) => {
    availabilityForm.setValue("weekDay", parseInt(dayValue));
  };

  const formatTime = (timeString: string) => {
    return new Date(`1970-01-01T${timeString}`).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const getDayName = (dayOfWeek: number) => {
    return daysOfWeek.find((d) => d.value === dayOfWeek)?.label || "";
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-semibold text-gray-800">
            Therapist Profile
          </h1>
          <Button
            onClick={() => setIsEditingProfile(!isEditingProfile)}
            variant={isEditingProfile ? "outline" : "default"}
          >
            {isEditingProfile ? (
              "Cancel"
            ) : (
              <>
                <Edit2Icon className="h-5 w-5 mr-2" />
                Edit Profile
              </>
            )}
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-6">
          {/* Profile Form */}
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={profileForm.handleSubmit(onSubmitProfile)}
                className="space-y-4"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      value={user?.name || ""}
                      disabled={!isEditingProfile}
                      className="bg-gray-50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      value={user?.email || ""}
                      disabled
                      className="bg-gray-50"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="specialization">Specialization</Label>
                  <Input
                    id="specialization"
                    {...profileForm.register("specialization")}
                    disabled={!isEditingProfile}
                    placeholder="e.g., Physical Therapy, Sports Rehabilitation"
                  />
                  {profileForm.formState.errors.specialization && (
                    <p className="text-sm text-red-500">
                      {profileForm.formState.errors.specialization.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="qualification">
                    Qualifications & Experience
                  </Label>
                  <Textarea
                    id="qualification"
                    {...profileForm.register("qualification")}
                    disabled={!isEditingProfile}
                    placeholder="e.g., B.P.T [W.B.U.H.S], Physiotherapist of IPGME&R AND SSKM HOSPITAL"
                    rows={6}
                    className="resize-none"
                  />
                  {profileForm.formState.errors.qualification && (
                    <p className="text-sm text-red-500">
                      {profileForm.formState.errors.qualification.message}
                    </p>
                  )}
                </div>

                {isEditingProfile && (
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                        Saving...
                      </div>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Save Changes
                      </>
                    )}
                  </Button>
                )}
              </form>
            </CardContent>
          </Card>

          {/* Weekly Availability Table */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Weekly Availability Schedule</CardTitle>
                <Button
                  onClick={openAddDialog}
                  className="bg-indigo-600 hover:bg-indigo-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Time Slot
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-indigo-700">
                      <TableHead className="font-semibold text-white">
                        Day
                      </TableHead>
                      <TableHead className="font-semibold text-white">
                        Start Time
                      </TableHead>
                      <TableHead className="font-semibold text-white">
                        End Time
                      </TableHead>
                      <TableHead className="font-semibold text-white">
                        Duration
                      </TableHead>
                      <TableHead className="font-semibold text-white">
                        Recurring
                      </TableHead>
                      <TableHead className="font-semibold text-white">
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {availabilities.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={6}
                          className="text-center py-8 text-gray-500"
                        >
                          No time slots set. Click "Add Time Slot" to get
                          started.
                        </TableCell>
                      </TableRow>
                    ) : (
                      availabilities
                        .sort((a, b) => a.weekDay - b.weekDay)
                        .map((availability) => {
                          const startTime = new Date(
                            `1970-01-01T${availability.startTime}`
                          );
                          const endTime = new Date(
                            `1970-01-01T${availability.endTime}`
                          );
                          const durationHours =
                            (endTime.getTime() - startTime.getTime()) /
                            (1000 * 60 * 60);

                          return (
                            <TableRow
                              key={availability.id}
                              className="hover:bg-gray-50"
                            >
                              <TableCell className="font-medium">
                                <Badge
                                  variant="outline"
                                  className="bg-blue-50 text-blue-700 border-blue-200"
                                >
                                  {daysOfWeek[availability.weekDay].label}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {formatTime(availability.startTime)}
                              </TableCell>
                              <TableCell>
                                {formatTime(availability.endTime)}
                              </TableCell>
                              <TableCell>
                                <span className="text-sm text-gray-600">
                                  {durationHours.toFixed(1)} hours
                                </span>
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant={
                                    availability.isRecurring
                                      ? "default"
                                      : "secondary"
                                  }
                                  className={
                                    availability.isRecurring
                                      ? "bg-green-100 text-green-800"
                                      : "bg-gray-100 text-gray-800"
                                  }
                                >
                                  {availability.isRecurring ? "Yes" : "No"}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    deleteAvailability(availability.id)
                                  }
                                  className="text-red-600 hover:text-red-800"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Add Time Slot Dialog */}
        <Dialog
          open={isAddAvailabilityOpen}
          onOpenChange={setIsAddAvailabilityOpen}
        >
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-indigo-600" />
                Add Time Slot
              </DialogTitle>
            </DialogHeader>
            <form
              onSubmit={availabilityForm.handleSubmit(onSubmitAvailability)}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label htmlFor="weekDay">Day of Week</Label>
                <Select
                  value={availabilityForm.watch("weekDay").toString()}
                  onValueChange={handleDayChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select day" />
                  </SelectTrigger>
                  <SelectContent>
                    {daysOfWeek.map((day) => (
                      <SelectItem key={day.value} value={day.value.toString()}>
                        {day.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {availabilityForm.formState.errors.weekDay && (
                  <p className="text-sm text-red-500">
                    {availabilityForm.formState.errors.weekDay.message}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startTime">Start Time</Label>
                  <Input
                    id="startTime"
                    type="time"
                    {...availabilityForm.register("startTime")}
                  />
                  {availabilityForm.formState.errors.startTime && (
                    <p className="text-sm text-red-500">
                      {availabilityForm.formState.errors.startTime.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="endTime">End Time</Label>
                  <Input
                    id="endTime"
                    type="time"
                    {...availabilityForm.register("endTime")}
                  />
                  {availabilityForm.formState.errors.endTime && (
                    <p className="text-sm text-red-500">
                      {availabilityForm.formState.errors.endTime.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isRecurring"
                  {...availabilityForm.register("isRecurring")}
                />
                <Label htmlFor="isRecurring">Recurring weekly</Label>
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAddAvailabilityOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="bg-indigo-600 hover:bg-indigo-700"
                >
                  {isLoading ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                      Adding...
                    </div>
                  ) : (
                    <>
                      <Clock className="h-4 w-4 mr-2" />
                      Add Time Slot
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
