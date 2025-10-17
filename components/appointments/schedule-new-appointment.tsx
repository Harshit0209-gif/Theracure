import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/auth-context";
import {
  Clock,
  User,
  Calendar,
  Activity,
  CheckCircle,
  XCircle,
  AlertCircle,
  Repeat,
  CalendarDays,
  Info,
} from "lucide-react";
import { Service } from "@/types/service";
import {
  AvailablePeriod,
  RecurringPreview,
  TherapistAvailability,
} from "@/types/appointments";
import {
  AppointmentFormData,
  appointmentFormSchema,
  appointmentFields,
} from "@/lib/validations/appointment";
import { RecurringEndType, RecurringType } from "@/lib/generated/bookingEnums";
import { ServiceCategory } from "@/lib/generated/serviceEnums";
import { ServiceCategoryLabel } from "@/lib/service";
import { Patient } from "@/types/patient";
import { debounce } from "lodash";
import ReactSelect from "react-select";
import { getServices } from "@/lib/api/services";
import { getDayName } from "@/lib/utils/utils";

interface ScheduleNewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAppointmentCreated: () => void;
}

export function ScheduleNewDialog({
  open,
  onOpenChange,
  onAppointmentCreated,
}: ScheduleNewDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [therapists, setTherapists] = useState([]);
  const [services, setServices] = useState<Service[]>([]);
  const [serviceCategories, setServiceCategories] = useState<ServiceCategory[]>(
    []
  );
  const [filteredServices, setFilteredServices] = useState<Service[]>([]);
  const [availablePeriods, setAvailablePeriods] = useState<AvailablePeriod[]>(
    []
  );
  const [therapistSchedule, setTherapistSchedule] = useState<
    TherapistAvailability[]
  >([]);
  const [existingAppointments, setExistingAppointments] = useState([]);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);
  const [recurringPreview, setRecurringPreview] = useState<RecurringPreview[]>(
    []
  );
  const [patientOptions, setPatientOptions] = useState<
    { value: string; label: string }[]
  >([]);

  const [isGeneratingPreview, setIsGeneratingPreview] = useState(false);
  const { user } = useAuth();

  const form = useForm<AppointmentFormData>({
    resolver: zodResolver(appointmentFormSchema),
    defaultValues: {
      patientId: "",
      therapistId: "",
      appointmentDate: "",
      startTime: "",
      endTime: "",
      serviceCategory: undefined,
      serviceId: "",
      notes: "",
      isRecurring: false,
      recurringType: undefined,
      recurringEndType: undefined,
      recurringCount: undefined,
      recurringEndDate: undefined,
    },
  });

  const watchedValues = form.watch();

  // Generate recurring appointment preview
  useEffect(() => {
    if (
      watchedValues.isRecurring &&
      watchedValues.appointmentDate &&
      watchedValues.recurringType &&
      watchedValues.recurringEndType &&
      ((watchedValues.recurringEndType === RecurringEndType.DATE &&
        watchedValues.recurringEndDate) ||
        (watchedValues.recurringEndType === RecurringEndType.COUNT &&
          watchedValues.recurringCount))
    ) {
      generateRecurringPreview();
    } else {
      setRecurringPreview([]);
    }
  }, [
    watchedValues.isRecurring,
    watchedValues.appointmentDate,
    watchedValues.recurringType,
    watchedValues.recurringEndType,
    watchedValues.recurringEndDate,
    watchedValues.recurringCount,
  ]);

  // Fetch initial data when dialog opens
  useEffect(() => {
    if (open) {
      fetchPatients();
      fetchTherapists();
      fetchData();
    }
  }, [open]);

  // Filter services when category changes
  useEffect(() => {
    if (watchedValues.serviceCategory) {
      const filtered = services.filter(
        (service) => service.category === watchedValues.serviceCategory
      );
      setFilteredServices(filtered);
    } else {
      setFilteredServices([]);
    }
    form.setValue("serviceId", "");
    setSelectedService(null);
  }, [watchedValues.serviceCategory, services]);

  // Update selected service details
  useEffect(() => {
    if (watchedValues.serviceId) {
      const serviceId = watchedValues.serviceId;

      const service = services.find((s) => s.id === serviceId);

      setSelectedService(service || null);
    } else {
      setSelectedService(null);
    }
  }, [watchedValues.serviceId, services]);

  // Check availability when therapist, date, or time changes
  useEffect(() => {
    if (watchedValues.therapistId && watchedValues.appointmentDate) {
      checkTherapistAvailability(
        watchedValues.therapistId,
        watchedValues.appointmentDate
      );
    }
  }, [watchedValues.therapistId, watchedValues.appointmentDate]);

  const fetchPatients = async () => {
    try {
      const response = await fetch("/api/patients?limit=100");
      const data = await response.json();
      if (data.success) {
        setPatients(data.patients);
      }
    } catch (error) {
      console.error("Error fetching patients:", error);
    }
  };

  function debounceAsync<F extends (...args: any[]) => Promise<void>>(
    fn: F,
    wait: number
  ) {
    const debounced = debounce((...args: Parameters<F>) => {
      fn(...args).catch(console.error);
    }, wait);

    return debounced;
  }

  const handlePatientSearch = debounceAsync(async (input: string) => {
    const query = input ? `?search=${input}&limit=50` : "?limit=50";
    const response = await fetch(`/api/patients${query}`);
    const data = await response.json();

    if (data.success) {
      setPatientOptions(
        data.patients.map((p: Patient) => ({
          value: String(p.id),
          label: `${p.patientName ?? ""} (${p.id})`,
        }))
      );
    }
  }, 300);

  const fetchTherapists = async () => {
    try {
      const response = await fetch("/api/users?role=therapist&limit=100");
      const data = await response.json();
      if (data.success) {
        setTherapists(data.users);
      }
    } catch (error) {
      console.error("Error fetching therapists:", error);
    }
  };

  const fetchData = async () => {
    try {
      const fetchedServices = await getServices();
      setServices(fetchedServices);

      const categories: ServiceCategory[] = [
        ...new Set(fetchedServices.map((s) => s.category)),
      ];
      setServiceCategories(categories);
    } catch (error) {
      console.error("Error fetching services:", error);
      toast({
        title: "Error",
        description: "Failed to fetch services. Please try again later.",
        variant: "destructive",
      });
    }
  };

  const checkTherapistAvailability = async (
    therapistId: string,
    date: string
  ) => {
    setIsCheckingAvailability(true);
    try {
      const appointmentDate = appointmentFields.appointmentDate.safeParse(date);
      const therapistResponse = await fetch(
        `/api/therapists/${therapistId}/availability?date=${appointmentDate.data}`
      );
      const therapistData = await therapistResponse.json();

      if (!therapistData?.success) {
        throw new Error(
          therapistData?.error ||
            "Failed to fetch therapist schedule and availability"
        );
      }

      const schedule: TherapistAvailability[] =
        therapistData.therapistSchedule?.map((slot: any) => ({
          dayOfWeek: slot.weekDay,
          startTime: slot.startTime,
          endTime: slot.endTime,
        }));
      setTherapistSchedule(schedule);

      const availablePeriods: AvailablePeriod[] =
        therapistData.availablePeriods.map((period: any) => ({
          startTime: period.startTime,
          endTime: period.endTime,
          available: period.available,
          duration: period.duration,
        }));
      setAvailablePeriods(availablePeriods);
    } catch (error) {
      console.error("Error checking availability:", error);
    } finally {
      setIsCheckingAvailability(false);
    }
  };

  const generateRecurringPreview = async () => {
    setIsGeneratingPreview(true);

    try {
      const {
        appointmentDate,
        recurringType,
        recurringEndType,
        recurringEndDate,
        recurringCount,
      } = watchedValues;
      const startDate = new Date(appointmentDate);
      const preview: RecurringPreview[] = [];

      // Determine end date
      const endDate = (() => {
        if (recurringEndType === RecurringEndType.DATE && recurringEndDate) {
          return new Date(recurringEndDate);
        }

        if (recurringEndType === RecurringEndType.COUNT && recurringCount) {
          const weeks =
            recurringType === RecurringType.BIWEEKLY
              ? recurringCount * 2
              : recurringType === RecurringType.MONTHLY
              ? recurringCount * 4
              : recurringCount;

          const temp = new Date(startDate);
          temp.setDate(temp.getDate() + weeks * 7);
          return temp;
        }

        return null;
      })();

      if (!endDate) return;

      const dayIncrements = {
        [RecurringType.WEEKLY]: 7,
        [RecurringType.BIWEEKLY]: 14,
        [RecurringType.MONTHLY]: 28,
      };

      // Generate preview
      for (
        let current = new Date(startDate);
        current <= endDate;
        current.setDate(
          current.getDate() +
            dayIncrements[recurringType ?? RecurringType.WEEKLY]
        )
      ) {
        preview.push({
          date: current.toISOString().split("T")[0],
          dayName: current.toLocaleDateString("en-US", { weekday: "long" }),
          formattedDate: current.toLocaleDateString("en-IN"),
          status: "available",
        });
      }
      setRecurringPreview(preview);
    } catch (error) {
      console.error("Error generating recurring preview:", error);
    } finally {
      setIsGeneratingPreview(false);
    }
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(":");
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? "PM" : "AM";
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const calculateDuration = (startTime: string, endTime: string) => {
    const start = new Date(`2000-01-01T${startTime}:00`);
    const end = new Date(`2000-01-01T${endTime}:00`);
    return Math.round((end.getTime() - start.getTime()) / (1000 * 60));
  };

  const generateRecurringAppointments = (baseData: AppointmentFormData) => {
    const appointments = [];
    const startDate = new Date(baseData.appointmentDate);

    let currentDate = new Date(startDate);
    let endDate: Date;

    if (
      baseData.recurringEndType === RecurringEndType.DATE &&
      baseData.recurringEndDate
    ) {
      endDate = new Date(baseData.recurringEndDate);
    } else if (
      baseData.recurringEndType === RecurringEndType.COUNT &&
      baseData.recurringCount
    ) {
      endDate = new Date(startDate);
      const totalWeeks =
        baseData.recurringType === RecurringType.WEEKLY
          ? baseData.recurringCount
          : baseData.recurringType === RecurringType.BIWEEKLY
          ? baseData.recurringCount * 2
          : baseData.recurringCount * 4;
      endDate.setDate(endDate.getDate() + totalWeeks * 7);
    } else {
      return [];
    }

    let increment: number;
    switch (baseData.recurringType) {
      case RecurringType.WEEKLY:
        increment = 7;
        break;
      case RecurringType.BIWEEKLY:
        increment = 14;
        break;
      case RecurringType.MONTHLY:
        increment = 28;
        break;
      default:
        increment = 7;
    }

    while (currentDate <= endDate) {
      appointments.push({
        ...baseData,
        appointmentDate: currentDate.toISOString().split("T")[0],
        appointmentStartTime: new Date(
          `${currentDate.toISOString().split("T")[0]}T${baseData.startTime}`
        ).toISOString(),
        appointmentEndTime: new Date(
          `${currentDate.toISOString().split("T")[0]}T${baseData.endTime}`
        ).toISOString(),
        createdById: user?.id,
        service: selectedService,
        isRecurring: true,
      });

      currentDate.setDate(currentDate.getDate() + increment);
      console.log("currentDate:", currentDate);
    }

    return appointments;
  };

  // Handle form submission with error feedback
  const handleFormSubmit = async () => {
    const formData = form.getValues();

    // Debug: Log form data to console
    console.log("Form data before validation:", formData);

    // Validate form data
    const validationResult = appointmentFormSchema.safeParse(formData);

    if (!validationResult.success) {
      // Show validation errors to user
      const errors = validationResult.error.errors;
      console.log("Form validation errors:", errors);

      // Find the first error and show it to the user
      const firstError = errors[0];
      const fieldName = firstError.path.join(".");

      toast({
        title: "Validation Error",
        description: `${fieldName}: ${firstError.message}`,
        variant: "destructive",
      });

      // Set form errors for individual fields
      errors.forEach((error) => {
        const fieldName = error.path[0] as keyof AppointmentFormData;
        if (fieldName) {
          form.setError(fieldName, {
            type: "manual",
            message: error.message,
          });
        }
      });

      return;
    }

    console.log("Form validation passed, submitting:", validationResult.data);

    // If validation passes, call the actual submit function
    await onSubmit(validationResult.data);
  };

  const onSubmit = async (data: AppointmentFormData) => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to schedule an appointment",
        variant: "destructive",
      });
      return;
    }

    if (!watchedValues.startTime || !watchedValues.endTime) {
      toast({
        title: "Missing Time Selection",
        description:
          "Please select both start and end times for the appointment.",
        variant: "destructive",
      });
      return;
    }

    // Check if selected time falls within available periods
    const isValidTime = availablePeriods.some(
      (period) =>
        period.available &&
        data.startTime >= period.startTime &&
        data.endTime <= period.endTime
    );

    if (!isValidTime) {
      toast({
        title: "Invalid Time Selection",
        description:
          "The selected time is not within available periods. Please choose a valid time range.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);
      setServerError(null);

      if (data.isRecurring) {
        // Generate recurring appointments
        const recurringAppointments = generateRecurringAppointments(data);

        if (recurringAppointments.length === 0) {
          toast({
            title: "Error",
            description:
              "No recurring appointments could be generated. Please check your settings.",
            variant: "destructive",
          });
          return;
        }

        // Create recurring appointments
        const response = await fetch("/api/appointments/recurring", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            appointments: recurringAppointments,
            recurringInfo: {
              type: data.recurringType,
              endType: data.recurringEndType,
              endDate: data.recurringEndDate,
              count: data.recurringCount,
            },
          }),
        });

        const result = await response.json();

        if (!response.ok) {
          setServerError(
            result.error || "Failed to schedule recurring appointments"
          );
          return;
        }

        toast({
          title: "Success",
          description: `${recurringAppointments.length} recurring appointments scheduled successfully`,
        });
      } else {
        // Create single appointment
        const appointmentData = {
          ...data,
          appointmentStartTime: new Date(
            `${data.appointmentDate}T${data.startTime}`
          ).toISOString(),
          appointmentEndTime: new Date(
            `${data.appointmentDate}T${data.endTime}`
          ).toISOString(),
          createdById: user.id,
          service: selectedService,
        };

        const response = await fetch("/api/appointments", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(appointmentData),
        });

        const result = await response.json();

        if (!response.ok) {
          setServerError(result.error || "Failed to schedule appointment");
          return;
        }

        toast({
          title: "Success",
          description: `Appointment scheduled successfully for ${formatTime(
            data.startTime
          )}`,
        });
      }

      form.reset();
      onOpenChange(false);
      onAppointmentCreated();
    } catch (error) {
      console.error("Appointment creation error:", error);
      setServerError("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-indigo-600" />
            Schedule New Appointment
          </DialogTitle>
          <DialogDescription>
            Create a new appointment by selecting patient, service, therapist,
            and available time slot. Enable recurring appointments for regular
            sessions.
          </DialogDescription>
        </DialogHeader>

        {serverError && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md mb-4 flex items-center gap-2">
            <XCircle className="h-4 w-4" />
            {serverError}
          </div>
        )}

        <div className="space-y-6">
          {/* Patient and Service Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="patientId" className="flex items-center gap-2">
                <User className="h-4 w-4 text-indigo-600" />
                Patient
              </Label>
              <ReactSelect
                options={patientOptions}
                onChange={(selectedOption) =>
                  form.setValue("patientId", selectedOption?.value || "")
                }
                onInputChange={handlePatientSearch}
                placeholder="Search and select patient"
                isSearchable
              />
              {form.formState.errors.patientId && (
                <p className="text-sm text-red-500">
                  {" "}
                  {form.formState.errors.patientId.message}{" "}
                </p>
              )}{" "}
            </div>{" "}
            <div className="space-y-2">
              <Label
                htmlFor="serviceCategory"
                className="flex items-center gap-2"
              >
                <Activity className="h-4 w-4 text-indigo-600" />
                Service Category
              </Label>
              <Select
                onValueChange={(value) =>
                  form.setValue("serviceCategory", value as ServiceCategory)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select service category" />
                </SelectTrigger>
                <SelectContent>
                  {serviceCategories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {ServiceCategoryLabel[category]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.serviceCategory && (
                <p className="text-sm text-red-500">
                  {form.formState.errors.serviceCategory.message}
                </p>
              )}
            </div>
          </div>

          {/* Service Selection */}
          {watchedValues.serviceCategory && (
            <div className="space-y-2">
              <Label htmlFor="serviceId">Select Service</Label>
              <Select
                onValueChange={(value) => form.setValue("serviceId", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select specific service" />
                </SelectTrigger>
                <SelectContent>
                  {filteredServices.map((service) => (
                    <SelectItem key={service.id} value={service.id.toString()}>
                      <div className="flex justify-between items-center w-full">
                        <span>{service.name}</span>
                        <div className="flex gap-2 ml-4">
                          <Badge variant="outline">₹{service.price}</Badge>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.serviceId && (
                <p className="text-sm text-red-500">
                  {form.formState.errors.serviceId.message}
                </p>
              )}
            </div>
          )}

          {/* Selected Service Details */}
          {selectedService && (
            <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
              <h4 className="font-semibold text-indigo-800 mb-2">
                Selected Service Details
              </h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Service:</span>
                  <p className="font-medium">{selectedService.name}</p>
                </div>
                <div>
                  <span className="text-gray-600">Price:</span>
                  <p className="font-medium">₹{selectedService.price}</p>
                </div>
              </div>
              {selectedService.description && (
                <p className="text-sm text-gray-600 mt-2">
                  {selectedService.description}
                </p>
              )}
            </div>
          )}

          {/* Therapist Selection */}
          <div className="space-y-2">
            <Label htmlFor="therapistId">Therapist</Label>
            <Select
              onValueChange={(value) => form.setValue("therapistId", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select therapist" />
              </SelectTrigger>
              <SelectContent>
                {therapists.map((therapist: any) => (
                  <SelectItem key={therapist.id} value={therapist.id}>
                    {therapist.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.therapistId && (
              <p className="text-sm text-red-500">
                {form.formState.errors.therapistId.message}
              </p>
            )}
          </div>

          {/* Date and Time Selection */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label htmlFor="appointmentDate">
                {watchedValues.isRecurring
                  ? "First Appointment Date"
                  : "Appointment Date"}
              </Label>
              <Input
                id="appointmentDate"
                type="date"
                {...form.register("appointmentDate")}
                min={new Date().toISOString().split("T")[0]}
              />
              {form.formState.errors.appointmentDate && (
                <p className="text-sm text-red-500">
                  {form.formState.errors.appointmentDate.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="startTime">Start Time</Label>
              <Input
                id="startTime"
                type="time"
                {...form.register("startTime")}
                onChange={(e) => {
                  form.setValue("startTime", e.target.value);
                  form.setValue("endTime", "");
                }}
                className="w-full"
              />
              {form.formState.errors.startTime && (
                <p className="text-sm text-red-500">
                  {form.formState.errors.startTime.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="endTime">End Time</Label>
              <Input
                id="endTime"
                type="time"
                {...form.register("endTime")}
                disabled={!watchedValues.startTime}
                className="w-full"
              />
              {form.formState.errors.endTime && (
                <p className="text-sm text-red-500">
                  {form.formState.errors.endTime.message}
                </p>
              )}
            </div>
          </div>

          {/* Recurring Appointment Option */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Repeat className="h-5 w-5 text-indigo-600" />
                Recurring Appointment
              </CardTitle>
              <CardDescription>
                Schedule multiple appointments at the same time and day of the
                week
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isRecurring"
                  checked={watchedValues.isRecurring}
                  onCheckedChange={(checked) =>
                    form.setValue("isRecurring", checked as boolean)
                  }
                />
                <Label htmlFor="isRecurring" className="text-sm font-medium">
                  Make this a recurring appointment
                </Label>
              </div>

              {watchedValues.isRecurring && (
                <div className="space-y-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="recurringType">Frequency</Label>
                      <Select
                        value={watchedValues.recurringType}
                        onValueChange={(value) =>
                          form.setValue("recurringType", value as RecurringType)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select frequency" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={RecurringType.WEEKLY}>
                            Weekly
                          </SelectItem>
                          <SelectItem value={RecurringType.BIWEEKLY}>
                            Bi-weekly (Every 2 weeks)
                          </SelectItem>
                          <SelectItem value={RecurringType.MONTHLY}>
                            Monthly (Every 4 weeks)
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="recurringEndType">End Method</Label>
                      <Select
                        value={watchedValues.recurringEndType}
                        onValueChange={(value) =>
                          form.setValue(
                            "recurringEndType",
                            value as RecurringEndType
                          )
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select end method" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={RecurringEndType.COUNT}>
                            Number of appointments
                          </SelectItem>
                          <SelectItem value={RecurringEndType.DATE}>
                            End date
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {watchedValues.recurringEndType ===
                    RecurringEndType.COUNT && (
                    <div className="space-y-2">
                      <Label htmlFor="recurringCount">
                        Number of Appointments
                      </Label>
                      <Input
                        id="recurringCount"
                        type="number"
                        min="1"
                        max="52"
                        value={watchedValues.recurringCount || ""}
                        onChange={(e) =>
                          form.setValue(
                            "recurringCount",
                            parseInt(e.target.value)
                          )
                        }
                        placeholder="Enter number of appointments"
                      />
                    </div>
                  )}

                  {watchedValues.recurringEndType === RecurringEndType.DATE && (
                    <div className="space-y-2">
                      <Label htmlFor="recurringEndDate">End Date</Label>
                      <Input
                        id="recurringEndDate"
                        type="date"
                        value={watchedValues.recurringEndDate || ""}
                        onChange={(e) =>
                          form.setValue("recurringEndDate", e.target.value)
                        }
                        min={watchedValues.appointmentDate}
                      />
                    </div>
                  )}

                  {/* Recurring Preview */}
                  {recurringPreview.length > 0 && (
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <CalendarDays className="h-4 w-4" />
                        Appointment Preview ({recurringPreview.length}{" "}
                        appointments)
                      </Label>
                      <div className="max-h-48 overflow-y-auto border rounded-lg p-3 bg-white">
                        {isGeneratingPreview ? (
                          <div className="flex items-center justify-center py-4">
                            <div className="animate-spin rounded-full h-6 w-6 border-2 border-indigo-600 border-t-transparent" />
                            <span className="ml-2 text-sm text-gray-600">
                              Generating preview...
                            </span>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {recurringPreview.map((appointment, index) => (
                              <div
                                key={index}
                                className="flex items-center justify-between p-2 bg-gray-50 rounded border"
                              >
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                                    <span className="text-xs font-medium text-indigo-600">
                                      {index + 1}
                                    </span>
                                  </div>
                                  <div>
                                    <p className="font-medium text-sm">
                                      {appointment.dayName},{" "}
                                      {appointment.formattedDate}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                      {watchedValues.startTime &&
                                      watchedValues.endTime
                                        ? `${formatTime(
                                            watchedValues.startTime
                                          )} - ${formatTime(
                                            watchedValues.endTime
                                          )}`
                                        : "Time not selected"}
                                    </p>
                                  </div>
                                </div>
                                <Badge variant="outline" className="text-xs">
                                  {appointment.status === "available"
                                    ? "Available"
                                    : appointment.status === "conflict"
                                    ? "Conflict"
                                    : "Unknown"}
                                </Badge>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Appointment Duration Display */}
          {watchedValues.startTime && watchedValues.endTime && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-green-600" />
                <span className="font-medium text-green-800">
                  Appointment Time: {formatTime(watchedValues.startTime)} -{" "}
                  {formatTime(watchedValues.endTime)} (
                  {calculateDuration(
                    watchedValues.startTime,
                    watchedValues.endTime
                  )}{" "}
                  minutes)
                </span>
              </div>
              {watchedValues.isRecurring && (
                <div className="flex items-center gap-2 mt-2">
                  <Info className="h-4 w-4 text-blue-600" />
                  <span className="text-sm text-blue-800">
                    This time will be used for all recurring appointments
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Availability Status */}
          {watchedValues.therapistId && watchedValues.appointmentDate && (
            <div className="space-y-2">
              <Label>Availability Status</Label>
              <div className="border rounded-lg p-4">
                {isCheckingAvailability ? (
                  <div className="flex items-center gap-2 text-gray-600">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-indigo-600 border-t-transparent" />
                    Checking availability...
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-indigo-600" />
                      <span className="font-medium">
                        {getDayName(watchedValues.appointmentDate)} -{" "}
                        {new Date(
                          watchedValues.appointmentDate
                        ).toLocaleDateString("en-IN")}
                      </span>
                    </div>
                    {availablePeriods.length > 0 ? (
                      <div className="space-y-3 mt-2">
                        <p className="text-sm text-gray-600">
                          Available periods:
                        </p>
                        {availablePeriods.map((period, index) => (
                          <div
                            key={index}
                            className={`flex items-center justify-between p-3 rounded-lg border ${
                              period.available
                                ? "bg-green-50 border-green-200 text-green-800"
                                : "bg-red-50 border-red-200 text-red-800"
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              {period.available ? (
                                <CheckCircle className="h-4 w-4" />
                              ) : (
                                <XCircle className="h-4 w-4" />
                              )}
                              <span className="font-medium">
                                {formatTime(period.startTime)} -{" "}
                                {formatTime(period.endTime)}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-red-600">
                        <AlertCircle className="h-4 w-4" />
                        <span>No available time periods for this date</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Add any additional notes or special instructions..."
              {...form.register("notes")}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleFormSubmit}
              disabled={
                isLoading ||
                !watchedValues.startTime ||
                !watchedValues.endTime ||
                availablePeriods.length === 0
              }
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              {isLoading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                  {watchedValues.isRecurring
                    ? "Scheduling..."
                    : "Scheduling..."}
                </div>
              ) : (
                <>
                  <Calendar className="h-4 w-4 mr-2" />
                  {watchedValues.isRecurring
                    ? `Schedule ${recurringPreview.length} Appointments`
                    : "Schedule Appointment"}
                </>
              )}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
