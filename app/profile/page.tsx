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
import {
  Calendar,
  Clock,
  Plus,
  Trash2,
  Edit2Icon,
  User2,
  Check,
  X,
} from "lucide-react";
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
import { RoleColors } from "@/lib/userRoles";
import { UserRole } from "@/lib/generated/userRoles";
import { updateUserSchema, UserUpdateFormData } from "@/lib/validations/user";
import { User } from "@/types/user";

const availabilitySchema = z
  .object({
    weekDay: z.number().min(0).max(6, "Please select a valid day"),
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
  specialization: z.string().min(3, "Specialization is required"),
  qualification: z.string().optional(),
  experiences: z.string().optional(),
});

type TherapistFormData = z.infer<typeof therapistSchema>;

interface Therapist {
  id: string;
  specialization?: string;
  qualification?: string;
}

interface Availability {
  id: string;
  weekDay: number;
  startTime: string;
  endTime: string;
  isRecurring: boolean;
  isAvailable: boolean;
  createdAt: string;
}

export default function UserProfile() {
  const { user: authUser, setUser: setUserContext } = useAuth();

  // Separate loading states for each section
  const [isUserLoading, setIsUserLoading] = useState(false);
  const [isTherapistLoading, setIsTherapistLoading] = useState(false);
  const [isAvailabilityLoading, setIsAvailabilityLoading] = useState(false);

  const [user, setUser] = useState<User | null>(null);
  const [therapist, setTherapist] = useState<Therapist | null>(null);
  const [availabilities, setAvailabilities] = useState<Availability[]>([]);

  // Separate edit states for each section
  const [isEditingUser, setIsEditingUser] = useState(false);
  const [isEditingTherapist, setIsEditingTherapist] = useState(false);
  const [isAddAvailabilityOpen, setIsAddAvailabilityOpen] = useState(false);

  const userForm = useForm<UserUpdateFormData>({
    resolver: zodResolver(updateUserSchema),
    defaultValues: {
      name: authUser?.name,
      email: authUser?.email || "",
    },
  });

  const therapistForm = useForm<TherapistFormData>({
    resolver: zodResolver(therapistSchema),
    defaultValues: {
      specialization: "",
      qualification: "",
      experiences: "",
    },
  });

  const availabilityForm = useForm<AvailabilityFormData>({
    resolver: zodResolver(availabilitySchema),
    defaultValues: {
      weekDay: 1,
      startTime: "09:00",
      endTime: "17:00",
      isRecurring: true,
    },
  });

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
    if (authUser?.id) {
      fetchUserProfile();
      if (authUser.role === UserRole.THERAPIST) {
        fetchTherapistProfile();
        fetchAvailabilities();
      }
    }
  }, [authUser?.id]);

  const fetchUserProfile = async () => {
    try {
      const response = await fetch(`/api/users/${authUser?.id}`);
      const data = await response.json();
      if (data.success) {
        setUser(data.user);
        userForm.reset({
          name: data.user.name || "",
          phone: data.user.phone || "",
        });
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
      toast({
        title: "Error",
        description: "Failed to fetch user profile",
        variant: "destructive",
      });
    }
  };

  const fetchTherapistProfile = async () => {
    try {
      const response = await fetch(`/api/therapists/${authUser?.id}`);
      const data = await response.json();
      if (data.success) {
        setTherapist(data.therapist);
        therapistForm.reset({
          specialization: data.therapist.specialization || "",
          qualification: data.therapist.qualification || "",
        });
      }
    } catch (error) {
      console.error("Error fetching therapist profile:", error);
    }
  };

  const fetchAvailabilities = async () => {
    try {
      const response = await fetch(
        `/api/therapists/${authUser?.id}/time-slots`
      );
      const data = await response.json();
      if (data.success) {
        setAvailabilities(data.timeSlots || []);
      }
    } catch (error) {
      console.error("Error fetching availabilities:", error);
    }
  };

  const onSubmitUserProfile = async (data: UserUpdateFormData) => {
    try {
      setIsUserLoading(true);
      const response = await fetch(`/api/users/${authUser?.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Failed to update profile");
      }

      const result = await response.json();

      if (result.success) {
        setUser((u) =>
          u
            ? {
                ...u,
                name: result.updatedUser.name,
                phone: result.updatedUser.phone,
              }
            : u
        );

        setUserContext(result.updatedUser);
        toast({
          title: "Success",
          description: "Profile updated successfully",
        });
        setIsEditingUser(false);
      }
      console.log("User updated:", user);
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to update profile",
        variant: "destructive",
      });
    } finally {
      setIsUserLoading(false);
    }
  };

  const onSubmitTherapistProfile = async (data: TherapistFormData) => {
    try {
      setIsTherapistLoading(true);
      const response = await fetch(`/api/therapists/${authUser?.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Failed to update therapist profile");
      }

      const result = await response.json();
      if (result.success) {
        setTherapist(result.therapist);
        toast({
          title: "Success",
          description: "Professional info updated successfully",
        });
        setIsEditingTherapist(false);
      }
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to update therapist profile",
        variant: "destructive",
      });
    } finally {
      setIsTherapistLoading(false);
    }
  };

  const onSubmitAvailability = async (data: AvailabilityFormData) => {
    try {
      setIsAvailabilityLoading(true);
      const response = await fetch(
        `/api/therapists/${authUser?.id}/time-slots`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        }
      );

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
      setIsAvailabilityLoading(false);
    }
  };

  const deleteAvailability = async (slotId: string) => {
    try {
      const response = await fetch(
        `/api/therapists/${authUser?.id}/time-slots?slotId=${slotId}`,
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

  const isTherapist = user?.role === UserRole.THERAPIST;

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900"></h1>
          <Badge
            variant="outline"
            className="px-3 py-1 text-sm capitalize bg-green-100 text-green-800"
          >
            {user?.status || "Inactive"}
          </Badge>
        </div>

        <div className="space-y-6">
          {/* Basic User Information */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <User2 className="h-5 w-5 text-indigo-600" />
                    Basic Information
                  </CardTitle>
                  <Badge
                    className={`${
                      RoleColors[authUser?.role || UserRole.THERAPIST]
                    } capitalize font-medium`}
                  >
                    {user?.role || "User"}
                  </Badge>
                  <span className="text-sm text-gray-500">
                    Register:{" "}
                    {user?.createdAt
                      ? new Date(user.createdAt).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })
                      : "N/A"}
                  </span>
                </div>
                <Button
                  onClick={() => setIsEditingUser(!isEditingUser)}
                  variant={isEditingUser ? "outline" : "ghost"}
                  className="bg-indigo-600 hover:bg-indigo-700"
                  size="sm"
                >
                  {isEditingUser ? (
                    <span className="flex items-center text-white">
                      <X className="h-4 w-4 mr-1" />
                      Cancel
                    </span>
                  ) : (
                    <span className="flex items-center text-white">
                      <Edit2Icon className="h-4 w-4 mr-1" />
                      Edit
                    </span>
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={userForm.handleSubmit(onSubmitUserProfile)}
                className="space-y-4"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-sm font-medium">
                      Name
                    </Label>
                    <Input
                      id="name"
                      {...userForm.register("name")}
                      disabled={!isEditingUser}
                      className={`${
                        !isEditingUser ? "bg-gray-50 border-gray-200" : ""
                      }`}
                    />
                    {userForm.formState.errors.name && (
                      <p className="text-sm text-red-500">
                        {userForm.formState.errors.name.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium">
                      Email
                    </Label>
                    <Input
                      id="email"
                      {...userForm.register("email")}
                      value={user?.email || ""}
                      disabled={!isEditingUser}
                      className="bg-gray-50 border-gray-200"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-sm font-medium">
                      Phone
                    </Label>
                    <Input
                      id="phone"
                      {...userForm.register("phone")}
                      disabled={!isEditingUser}
                      className={`${
                        !isEditingUser ? "bg-gray-50 border-gray-200" : ""
                      }`}
                      placeholder="Enter phone number"
                    />
                  </div>
                </div>

                {isEditingUser && (
                  <div className="flex gap-2 pt-2">
                    <Button
                      type="submit"
                      disabled={isUserLoading}
                      className="bg-indigo-600 hover:bg-indigo-700"
                      size="sm"
                    >
                      {isUserLoading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Check className="h-4 w-4 mr-2" />
                          Save Changes
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </form>
            </CardContent>
          </Card>

          {/* Therapist-specific Information */}
          {isTherapist && (
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">
                    Professional Information
                  </CardTitle>
                  <Button
                    onClick={() => setIsEditingTherapist(!isEditingTherapist)}
                    variant={isEditingTherapist ? "outline" : "ghost"}
                    size="sm"
                    className="bg-indigo-600 hover:bg-indigo-700"
                  >
                    {isEditingUser ? (
                      <span className="flex items-center text-white">
                        <X className="h-4 w-4 mr-1" />
                        Cancel
                      </span>
                    ) : (
                      <span className="flex items-center text-white">
                        <Edit2Icon className="h-4 w-4 mr-1" />
                        Edit
                      </span>
                    )}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <form
                  onSubmit={therapistForm.handleSubmit(
                    onSubmitTherapistProfile
                  )}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <Label
                      htmlFor="specialization"
                      className="text-sm font-medium"
                    >
                      Specialization
                    </Label>
                    <Input
                      id="specialization"
                      {...therapistForm.register("specialization")}
                      disabled={!isEditingTherapist}
                      placeholder="e.g., Physical Therapy, Sports Rehabilitation"
                      className={`${
                        !isEditingTherapist ? "bg-gray-50 border-gray-200" : ""
                      }`}
                    />
                    {therapistForm.formState.errors.specialization && (
                      <p className="text-sm text-red-500">
                        {therapistForm.formState.errors.specialization.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="qualification"
                      className="text-sm font-medium"
                    >
                      Qualifications
                    </Label>
                    <Textarea
                      id="qualification"
                      {...therapistForm.register("qualification")}
                      disabled={!isEditingTherapist}
                      placeholder="e.g., B.P.T [W.B.U.H.S], M.P.T in Orthopedics, Certified Manual Therapist"
                      rows={3}
                      className={`resize-none ${
                        !isEditingTherapist ? "bg-gray-50 border-gray-200" : ""
                      }`}
                    />
                    {therapistForm.formState.errors.qualification && (
                      <p className="text-sm text-red-500">
                        {therapistForm.formState.errors.qualification.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="experience" className="text-sm font-medium">
                      Experience
                    </Label>
                    <Textarea
                      id="experience"
                      {...therapistForm.register("experiences")}
                      disabled={!isEditingTherapist}
                      placeholder="e.g., 5+ years at IPGME&R AND SSKM HOSPITAL, Specialized in post-operative rehabilitation"
                      rows={3}
                      className={`resize-none ${
                        !isEditingTherapist ? "bg-gray-50 border-gray-200" : ""
                      }`}
                    />
                    {therapistForm.formState.errors.experiences && (
                      <p className="text-sm text-red-500">
                        {therapistForm.formState.errors.experiences.message}
                      </p>
                    )}
                  </div>

                  {isEditingTherapist && (
                    <div className="flex gap-2 pt-2">
                      <Button
                        type="submit"
                        disabled={isTherapistLoading}
                        className="bg-indigo-600 hover:bg-indigo-700"
                        size="sm"
                      >
                        {isTherapistLoading ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Check className="h-4 w-4 mr-2" />
                            Save Changes
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </form>
              </CardContent>
            </Card>
          )}

          {/* Weekly Availability Table */}
          {isTherapist && (
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-4">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-lg">Weekly Availability</CardTitle>
                  <Button
                    onClick={openAddDialog}
                    className="bg-indigo-600 hover:bg-indigo-700"
                    size="sm"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Slot
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="font-semibold">Day</TableHead>
                        <TableHead className="font-semibold">Time</TableHead>
                        <TableHead className="font-semibold">
                          Duration
                        </TableHead>
                        <TableHead className="font-semibold">
                          Recurring
                        </TableHead>
                        <TableHead className="font-semibold w-16">
                          Actions
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {availabilities.length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={5}
                            className="text-center py-8 text-gray-500"
                          >
                            No time slots available. Add your first slot to get
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
                                <TableCell>
                                  <Badge
                                    variant="outline"
                                    className="bg-blue-50 text-blue-700"
                                  >
                                    {daysOfWeek[availability.weekDay].label}
                                  </Badge>
                                </TableCell>
                                <TableCell className="font-medium">
                                  {formatTime(availability.startTime)} -{" "}
                                  {formatTime(availability.endTime)}
                                </TableCell>
                                <TableCell className="text-sm text-gray-600">
                                  {durationHours.toFixed(1)}h
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
                                    className="text-red-600 hover:text-red-800 h-8 w-8 p-0"
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
          )}
        </div>

        {/* Add Time Slot Dialog */}
        {isTherapist && (
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
                  <Label htmlFor="weekDay" className="text-sm font-medium">
                    Day of Week
                  </Label>
                  <Select
                    value={availabilityForm.watch("weekDay").toString()}
                    onValueChange={handleDayChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select day" />
                    </SelectTrigger>
                    <SelectContent>
                      {daysOfWeek.map((day) => (
                        <SelectItem
                          key={day.value}
                          value={day.value.toString()}
                        >
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
                    <Label htmlFor="startTime" className="text-sm font-medium">
                      Start Time
                    </Label>
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
                    <Label htmlFor="endTime" className="text-sm font-medium">
                      End Time
                    </Label>
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
                    className="rounded border-gray-300"
                  />
                  <Label htmlFor="isRecurring" className="text-sm font-medium">
                    Recurring weekly
                  </Label>
                </div>

                <DialogFooter className="gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsAddAvailabilityOpen(false)}
                    size="sm"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isAvailabilityLoading}
                    className="bg-indigo-600 hover:bg-indigo-700"
                    size="sm"
                  >
                    {isAvailabilityLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                        Adding...
                      </>
                    ) : (
                      <>
                        <Clock className="h-4 w-4 mr-2" />
                        Add Slot
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </DashboardLayout>
  );
}
