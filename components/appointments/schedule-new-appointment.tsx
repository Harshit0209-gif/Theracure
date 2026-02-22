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
  Home,
} from "lucide-react";
import { Service } from "@/types/service";
import { RecurringPreview, TherapistAvailability } from "@/types/appointments";
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
  const [therapists, setTherapists] = useState([]);
  const [services, setServices] = useState<Service[]>([]);
  const [serviceCategories, setServiceCategories] = useState<ServiceCategory[]>(
    [],
  );
  const [filteredServices, setFilteredServices] = useState<Service[]>([]);
  const [therapistSchedule, setTherapistSchedule] = useState<
    TherapistAvailability[]
  >([]);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);
  const [recurringPreview, setRecurringPreview] = useState<RecurringPreview[]>(
    [],
  );
  const [patientOptions, setPatientOptions] = useState<
    { value: string; label: string }[]
  >([]);
  const [customDates, setCustomDates] = useState<string[]>([]);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isStartDateCalendarOpen, setIsStartDateCalendarOpen] = useState(false);
  const [isEndDateCalendarOpen, setIsEndDateCalendarOpen] = useState(false);

  const [isGeneratingPreview, setIsGeneratingPreview] = useState(false);
  const [cubicleAvailability, setCubicleAvailability] = useState<any>(null);
  const [isCheckingCubicles, setIsCheckingCubicles] = useState(false);
  const [selectedCubicleId, setSelectedCubicleId] = useState<string>("");
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
      customDates: undefined,
    },
  });

  const watchedValues = form.watch();

  // Generate recurring appointment preview
  useEffect(() => {
    if (watchedValues.isRecurring && watchedValues.recurringType) {
      // For CUSTOM type, only need customDates
      if (
        watchedValues.recurringType === RecurringType.CUSTOM &&
        customDates.length > 0
      ) {
        generateRecurringPreview();
      }
      // For other types, need appointmentDate and end conditions
      else if (
        watchedValues.recurringType !== RecurringType.CUSTOM &&
        watchedValues.appointmentDate &&
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
    customDates,
  ]);

  // Fetch initial data when dialog opens
  useEffect(() => {
    if (open) {
      fetchTherapists();
      fetchData();
    }
  }, [open]);

  // Filter services when category changes
  useEffect(() => {
    if (watchedValues.serviceCategory) {
      const filtered = services.filter(
        (service) => service.category === watchedValues.serviceCategory,
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
        watchedValues.appointmentDate,
      );
    }
  }, [watchedValues.therapistId, watchedValues.appointmentDate]);

  // Check cubicle availability when date and time changes
  useEffect(() => {
    if (
      watchedValues.appointmentDate &&
      watchedValues.startTime &&
      watchedValues.endTime
    ) {
      checkCubicleAvailability(
        watchedValues.appointmentDate,
        watchedValues.startTime,
        watchedValues.endTime,
      );
    } else {
      setCubicleAvailability(null);
    }
  }, [
    watchedValues.appointmentDate,
    watchedValues.startTime,
    watchedValues.endTime,
  ]);

  function debounceAsync<F extends (...args: any[]) => Promise<void>>(
    fn: F,
    wait: number,
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
        })),
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
    date: string,
  ) => {
    setIsCheckingAvailability(true);
    try {
      const appointmentDate = appointmentFields.appointmentDate.safeParse(date);
      const therapistResponse = await fetch(
        `/api/therapists/${therapistId}/availability?date=${appointmentDate.data}`,
      );
      const therapistData = await therapistResponse.json();

      if (!therapistData?.success) {
        throw new Error(
          therapistData?.error ||
            "Failed to fetch therapist schedule and availability",
        );
      }

      const schedule: TherapistAvailability[] =
        therapistData.therapistSchedule?.map((slot: any) => ({
          dayOfWeek: slot.weekDay,
          startTime: slot.startTime,
          endTime: slot.endTime,
        })) || [];
      setTherapistSchedule(schedule);
    } catch (error) {
      console.error("Error checking availability:", error);
      setTherapistSchedule([]);
    } finally {
      setIsCheckingAvailability(false);
    }
  };

  const checkCubicleAvailability = async (
    date: string,
    startTime: string,
    endTime: string,
  ) => {
    setIsCheckingCubicles(true);
    try {
      const startDateTime = new Date(`${date}T${startTime}`).toISOString();
      const endDateTime = new Date(`${date}T${endTime}`).toISOString();

      const response = await fetch(
        `/api/cubicles/availability?startTime=${startDateTime}&endTime=${endDateTime}`,
      );
      const data = await response.json();

      if (data.success) {
        setCubicleAvailability(data.availability);
      } else {
        console.error("Error checking cubicle availability:", data.error);
        setCubicleAvailability(null);
      }
    } catch (error) {
      console.error("Error checking cubicle availability:", error);
      setCubicleAvailability(null);
    } finally {
      setIsCheckingCubicles(false);
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
      const preview: RecurringPreview[] = [];

      // Handle CUSTOM type
      if (recurringType === RecurringType.CUSTOM) {
        customDates.forEach((dateStr) => {
          const date = new Date(dateStr);
          preview.push({
            date: dateStr,
            dayName: date.toLocaleDateString("en-US", { weekday: "long" }),
            formattedDate: date.toLocaleDateString("en-IN"),
            status: "available",
          });
        });
        setRecurringPreview(preview);
        setIsGeneratingPreview(false);
        return;
      }

      // Handle DAILY, WEEKLY, BIWEEKLY, MONTHLY
      const startDate = new Date(appointmentDate);

      // Determine end date
      const endDate = (() => {
        if (recurringEndType === RecurringEndType.DATE && recurringEndDate) {
          return new Date(recurringEndDate);
        }

        if (recurringEndType === RecurringEndType.COUNT && recurringCount) {
          const days =
            recurringType === RecurringType.DAILY
              ? recurringCount - 1
              : recurringType === RecurringType.WEEKLY
                ? (recurringCount - 1) * 7
                : recurringType === RecurringType.BIWEEKLY
                  ? (recurringCount - 1) * 14
                  : (recurringCount - 1) * 28; // MONTHLY

          const temp = new Date(startDate);
          temp.setDate(temp.getDate() + days);
          return temp;
        }

        return null;
      })();

      if (!endDate) return;

      const dayIncrements = {
        [RecurringType.DAILY]: 1,
        [RecurringType.WEEKLY]: 7,
        [RecurringType.BIWEEKLY]: 14,
        [RecurringType.MONTHLY]: 28,
      };

      // Generate preview
      for (
        let current = new Date(startDate);
        current <= endDate && preview.length < 100;
        current.setDate(
          current.getDate() +
            dayIncrements[recurringType ?? RecurringType.WEEKLY],
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
    // Check if time is an ISO string or just HH:MM
    if (time.includes("T") || time.includes("Z")) {
      // It's an ISO datetime string
      const date = new Date(time);
      const hours = date.getHours();
      const minutes = date.getMinutes();
      const ampm = hours >= 12 ? "PM" : "AM";
      const displayHour = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
      const displayMinutes = minutes.toString().padStart(2, "0");
      return `${displayHour}:${displayMinutes} ${ampm}`;
    } else {
      // It's HH:MM format
      const [hours, minutes] = time.split(":");
      const hour = parseInt(hours);
      const ampm = hour >= 12 ? "PM" : "AM";
      const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
      return `${displayHour}:${minutes} ${ampm}`;
    }
  };

  const calculateDuration = (startTime: string, endTime: string) => {
    const start = new Date(`2000-01-01T${startTime}:00`);
    const end = new Date(`2000-01-01T${endTime}:00`);
    return Math.round((end.getTime() - start.getTime()) / (1000 * 60));
  };

  // Calendar helper functions
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    return { daysInMonth, startingDayOfWeek, year, month };
  };

  const formatDateToString = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const isDateSelected = (dateStr: string) => {
    return customDates.includes(dateStr);
  };

  const toggleDate = (dateStr: string) => {
    if (isDateSelected(dateStr)) {
      setCustomDates(customDates.filter((d) => d !== dateStr));
    } else {
      setCustomDates([...customDates, dateStr]);
    }
  };

  const isPastDate = (dateStr: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return new Date(dateStr) < today;
  };

  const generateRecurringAppointments = (
    baseData: AppointmentFormData,
  ): any[] => {
    const appointments: any[] = [];

    // Handle CUSTOM type
    if (baseData.recurringType === RecurringType.CUSTOM) {
      if (!customDates || customDates.length === 0) {
        return [];
      }

      customDates.forEach((dateStr) => {
        appointments.push({
          ...baseData,
          appointmentDate: dateStr,
          appointmentStartTime: new Date(
            `${dateStr}T${baseData.startTime}`,
          ).toISOString(),
          appointmentEndTime: new Date(
            `${dateStr}T${baseData.endTime}`,
          ).toISOString(),
          createdById: user?.id,
          service: selectedService,
          isRecurring: true,
        });
      });

      return appointments;
    }

    // Handle DAILY, WEEKLY, BIWEEKLY, MONTHLY
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
      const totalDays =
        baseData.recurringType === RecurringType.DAILY
          ? baseData.recurringCount - 1
          : baseData.recurringType === RecurringType.WEEKLY
            ? (baseData.recurringCount - 1) * 7
            : baseData.recurringType === RecurringType.BIWEEKLY
              ? (baseData.recurringCount - 1) * 14
              : (baseData.recurringCount - 1) * 28;
      endDate.setDate(endDate.getDate() + totalDays);
    } else {
      return [];
    }

    let increment: number;
    switch (baseData.recurringType) {
      case RecurringType.DAILY:
        increment = 1;
        break;
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

    while (currentDate <= endDate && appointments.length < 100) {
      appointments.push({
        ...baseData,
        appointmentDate: currentDate.toISOString().split("T")[0],
        appointmentStartTime: new Date(
          `${currentDate.toISOString().split("T")[0]}T${baseData.startTime}`,
        ).toISOString(),
        appointmentEndTime: new Date(
          `${currentDate.toISOString().split("T")[0]}T${baseData.endTime}`,
        ).toISOString(),
        createdById: user?.id,
        service: selectedService,
        isRecurring: true,
      });

      currentDate.setDate(currentDate.getDate() + increment);
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
            result.error || "Failed to schedule recurring appointments",
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
            `${data.appointmentDate}T${data.startTime}`,
          ).toISOString(),
          appointmentEndTime: new Date(
            `${data.appointmentDate}T${data.endTime}`,
          ).toISOString(),
          createdById: user.id,
          service: selectedService,
          cubicleId: selectedCubicleId || undefined,
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
            data.startTime,
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
            </CardContent>
          </Card>

          {/* Date and Time Selection */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label
                htmlFor="appointmentDate"
                className="flex items-center gap-1"
              >
                {watchedValues.isRecurring
                  ? "First Appointment Date"
                  : "Appointment Date"}
                {watchedValues.isRecurring &&
                  watchedValues.recurringType &&
                  watchedValues.recurringType !== RecurringType.CUSTOM && (
                    <span className="text-red-500">*</span>
                  )}
              </Label>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsStartDateCalendarOpen(true)}
                className="w-full flex justify-between items-center border-indigo-200 hover:border-indigo-400 hover:bg-indigo-50 h-10 px-3"
              >
                <span
                  className={
                    watchedValues.appointmentDate
                      ? "text-indigo-900 font-medium"
                      : "text-gray-500"
                  }
                >
                  {watchedValues.appointmentDate
                    ? new Date(watchedValues.appointmentDate).toLocaleDateString(
                        "en-IN",
                        {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        },
                      )
                    : "Select date"}
                </span>
                <Calendar className="h-4 w-4 text-indigo-500" />
              </Button>
              {form.formState.errors.appointmentDate && (
                <p className="text-sm text-red-500">
                  {form.formState.errors.appointmentDate.message}
                </p>
              )}
              {watchedValues.isRecurring &&
                watchedValues.recurringType &&
                watchedValues.recurringType !== RecurringType.CUSTOM &&
                !watchedValues.appointmentDate && (
                  <p className="text-sm text-amber-600 flex items-center gap-1">
                    <Info className="h-3 w-3" />
                    Required to generate recurring schedule
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

          {/* Recurring Appointment Options Details */}
          {watchedValues.isRecurring && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Repeat className="h-5 w-5 text-indigo-600" />
                  Recurring Schedule Details
                </CardTitle>
                <CardDescription>
                  Configure the frequency and dates for recurring appointments
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="recurringType">Frequency</Label>
                      <Select
                        value={watchedValues.recurringType}
                        onValueChange={(value) => {
                          form.setValue(
                            "recurringType",
                            value as RecurringType,
                          );
                          // Reset custom dates when changing type
                          if (value !== RecurringType.CUSTOM) {
                            setCustomDates([]);
                          }
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select frequency" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={RecurringType.DAILY}>
                            Daily
                          </SelectItem>
                          <SelectItem value={RecurringType.WEEKLY}>
                            Weekly
                          </SelectItem>
                          <SelectItem value={RecurringType.BIWEEKLY}>
                            Bi-weekly (Every 2 weeks)
                          </SelectItem>
                          <SelectItem value={RecurringType.MONTHLY}>
                            Monthly (Every 4 weeks)
                          </SelectItem>
                          <SelectItem value={RecurringType.CUSTOM}>
                            Custom Dates
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {watchedValues.recurringType !== RecurringType.CUSTOM && (
                      <div className="space-y-2">
                        <Label htmlFor="recurringEndType">End Method</Label>
                        <Select
                          value={watchedValues.recurringEndType}
                          onValueChange={(value) =>
                            form.setValue(
                              "recurringEndType",
                              value as RecurringEndType,
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
                    )}
                  </div>

                  {/* Custom Date Picker for CUSTOM type */}
                  {watchedValues.recurringType === RecurringType.CUSTOM && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="text-base font-semibold text-slate-700">
                          Custom Appointment Dates
                        </Label>
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => setIsCalendarOpen(true)}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
                        >
                          <CalendarDays className="h-4 w-4 mr-2" />
                          {customDates.length === 0
                            ? "Select Dates"
                            : "Modify Selection"}
                        </Button>
                      </div>

                      {/* Selected Dates Display */}
                      {customDates.length > 0 && (
                        <div className="bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 rounded-xl border-2 border-indigo-200 p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <div className="p-1.5 bg-indigo-600 rounded-lg">
                                <CheckCircle className="h-4 w-4 text-white" />
                              </div>
                              <span className="text-sm font-bold text-indigo-900">
                                {customDates.length}{" "}
                                {customDates.length === 1 ? "Date" : "Dates"}{" "}
                                Selected
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => setCustomDates([])}
                              className="text-xs font-medium text-red-600 hover:text-red-700 hover:underline"
                            >
                              Clear All
                            </button>
                          </div>
                          <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                            {customDates.sort().map((date, idx) => (
                              <div
                                key={idx}
                                className="group flex items-center gap-2 px-3 py-1.5 bg-white text-indigo-700 rounded-lg text-xs font-semibold border border-indigo-200 hover:border-indigo-400 transition-all shadow-sm hover:shadow-md"
                              >
                                <Calendar className="h-3 w-3 text-indigo-500" />
                                <span>
                                  {new Date(date).toLocaleDateString("en-IN", {
                                    day: "2-digit",
                                    month: "short",
                                    year: "numeric",
                                  })}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setCustomDates(
                                      customDates.filter((d) => d !== date),
                                    );
                                  }}
                                  className="text-indigo-400 hover:text-red-600 transition-colors"
                                >
                                  <XCircle className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Empty State */}
                      {customDates.length === 0 && (
                        <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-lg border border-dashed border-slate-300 p-6 text-center">
                          <div className="inline-flex p-2 bg-white rounded-full shadow-sm mb-2">
                            <CalendarDays className="h-6 w-6 text-slate-400" />
                          </div>
                          <p className="text-sm text-slate-600 font-medium">
                            No dates selected yet
                          </p>
                          <p className="text-xs text-slate-500 mt-1">
                            Click the button above to select dates
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {watchedValues.recurringType !== RecurringType.CUSTOM &&
                    watchedValues.recurringEndType ===
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
                              parseInt(e.target.value),
                            )
                          }
                          placeholder="Enter number of appointments"
                        />
                      </div>
                    )}

                  {watchedValues.recurringType !== RecurringType.CUSTOM &&
                    watchedValues.recurringEndType ===
                      RecurringEndType.DATE && (
                      <div className="space-y-2">
                        <Label htmlFor="recurringEndDate">End Date</Label>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setIsEndDateCalendarOpen(true)}
                          className="w-full flex justify-between items-center border-indigo-200 hover:border-indigo-400 hover:bg-indigo-50 h-10 px-3"
                        >
                          <span
                            className={
                              watchedValues.recurringEndDate
                                ? "text-indigo-900 font-medium"
                                : "text-gray-500"
                            }
                          >
                            {watchedValues.recurringEndDate
                              ? new Date(
                                  watchedValues.recurringEndDate,
                                ).toLocaleDateString("en-IN", {
                                  day: "2-digit",
                                  month: "short",
                                  year: "numeric",
                                })
                              : "Select end date"}
                          </span>
                          <Calendar className="h-4 w-4 text-indigo-500" />
                        </Button>
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
                                            watchedValues.startTime,
                                          )} - ${formatTime(
                                            watchedValues.endTime,
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
              </CardContent>
            </Card>
          )}

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
                    watchedValues.endTime,
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

          {/* Therapist Availability Status */}
          {watchedValues.therapistId && watchedValues.appointmentDate && (
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <User className="h-4 w-4 text-indigo-600" />
                Therapist Availability
              </Label>
              <div className="border rounded-lg p-4">
                {isCheckingAvailability ? (
                  <div className="flex items-center gap-2 text-gray-600">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-indigo-600 border-t-transparent" />
                    Checking therapist schedule...
                  </div>
                ) : therapistSchedule.length > 0 ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <div>
                        <p className="text-sm font-medium text-green-800">
                          Therapist is available on{" "}
                          {getDayName(watchedValues.appointmentDate)}
                        </p>
                        <p className="text-xs text-green-700 mt-0.5">
                          Working hours:{" "}
                          {therapistSchedule
                            .map(
                              (slot) =>
                                `${formatTime(slot.startTime)} - ${formatTime(slot.endTime)}`,
                            )
                            .join(", ")}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <AlertCircle className="h-5 w-5 text-red-600" />
                    <div>
                      <p className="text-sm font-medium text-red-800">
                        Therapist not available on this date
                      </p>
                      <p className="text-xs text-red-700 mt-0.5">
                        Please select a different date or therapist
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Cubicle Availability Status */}
          {watchedValues.appointmentDate &&
            watchedValues.startTime &&
            watchedValues.endTime && (
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Home className="h-4 w-4 text-indigo-600" />
                  Cubicle Availability
                </Label>
                <div className="border rounded-lg p-4">
                  {isCheckingCubicles ? (
                    <div className="flex items-center gap-2 text-gray-600">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-indigo-600 border-t-transparent" />
                      Checking cubicle availability...
                    </div>
                  ) : cubicleAvailability ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-center gap-2">
                          <Info className="h-4 w-4 text-blue-600" />
                          <span className="text-sm font-medium text-blue-800">
                            {cubicleAvailability.totalCubicles} total cubicles
                          </span>
                        </div>
                        <div className="flex gap-3 text-xs">
                          <span className="text-green-700 font-medium">
                            ✓ {cubicleAvailability.availableCount} available
                          </span>
                          <span className="text-red-700 font-medium">
                            ✗ {cubicleAvailability.occupiedCount} occupied
                          </span>
                        </div>
                      </div>

                      {/* Cubicle Selection - Rounded Buttons */}
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-3">
                          Select a cubicle for this appointment:
                        </p>

                        {/* All Cubicles - Available and Occupied */}
                        <div className="flex flex-wrap gap-3">
                          {/* Available Cubicles */}
                          {cubicleAvailability.availableCubicles.map(
                            (cubicle: any) => (
                              <button
                                key={cubicle.id}
                                type="button"
                                onClick={() => setSelectedCubicleId(cubicle.id)}
                                className={`px-6 py-3 rounded-full font-medium text-sm transition-all shadow-sm hover:shadow-md ${
                                  selectedCubicleId === cubicle.id
                                    ? "bg-indigo-600 text-white ring-4 ring-indigo-200 scale-105"
                                    : "bg-green-500 text-white hover:bg-green-600"
                                }`}
                              >
                                {cubicle.name}
                              </button>
                            ),
                          )}

                          {/* Occupied Cubicles */}
                          {cubicleAvailability.occupiedCubicles.map(
                            (cubicle: any) => (
                              <button
                                key={cubicle.id}
                                type="button"
                                disabled
                                className="px-6 py-3 rounded-full font-medium text-sm bg-red-500 text-white opacity-60 cursor-not-allowed"
                              >
                                {cubicle.name}
                              </button>
                            ),
                          )}
                        </div>

                        {/* Selected Cubicle Details */}
                        {selectedCubicleId && (
                          <div className="mt-4 p-4 bg-indigo-50 border-2 border-indigo-300 rounded-lg">
                            <div className="flex items-start gap-3">
                              <div className="h-10 w-10 bg-indigo-600 rounded-full flex items-center justify-center flex-shrink-0">
                                <Home className="h-5 w-5 text-white" />
                              </div>
                              <div className="flex-1">
                                <h4 className="font-semibold text-indigo-900 mb-1">
                                  Selected Cubicle Details
                                </h4>
                                {(() => {
                                  const selected =
                                    cubicleAvailability.availableCubicles.find(
                                      (c: any) => c.id === selectedCubicleId,
                                    );
                                  return selected ? (
                                    <div className="space-y-1 text-sm">
                                      <p className="text-indigo-800 font-medium">
                                        <span className="font-semibold">
                                          Name:
                                        </span>{" "}
                                        {selected.name}
                                      </p>
                                      {selected.roomNumber && (
                                        <p className="text-indigo-700">
                                          <span className="font-semibold">
                                            Room Number:
                                          </span>{" "}
                                          {selected.roomNumber}
                                        </p>
                                      )}
                                      {selected.location && (
                                        <p className="text-indigo-700">
                                          <span className="font-semibold">
                                            Location:
                                          </span>{" "}
                                          {selected.location}
                                        </p>
                                      )}
                                      <div className="mt-2 pt-2 border-t border-indigo-200">
                                        <p className="text-xs text-indigo-600 flex items-center gap-1">
                                          <CheckCircle className="h-3 w-3" />
                                          This cubicle will be assigned to your
                                          appointment
                                        </p>
                                      </div>
                                    </div>
                                  ) : null;
                                })()}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Legend */}
                        <div className="mt-3 flex items-center gap-4 text-xs">
                          <div className="flex items-center gap-2">
                            <div className="h-4 w-4 bg-green-500 rounded-full"></div>
                            <span className="text-gray-600">Available</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="h-4 w-4 bg-red-500 rounded-full opacity-60"></div>
                            <span className="text-gray-600">Occupied</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="h-4 w-4 bg-indigo-600 rounded-full"></div>
                            <span className="text-gray-600">Selected</span>
                          </div>
                        </div>
                      </div>

                      {/* Cubicle Booking Timeline - Show when cubicle is selected */}
                      {selectedCubicleId &&
                        cubicleAvailability.occupiedCubicles.find(
                          (c: any) => c.id === selectedCubicleId,
                        ) === undefined && (
                          <div className="mt-4">
                            <div className="flex items-center gap-2 mb-3">
                              <CalendarDays className="h-5 w-5 text-indigo-600" />
                              <h4 className="text-sm font-semibold text-gray-800">
                                Today's Booking Schedule
                              </h4>
                            </div>
                            <div className="bg-gradient-to-br from-white to-gray-50 border-2 border-gray-200 rounded-xl p-5 shadow-sm">
                              {(() => {
                                const selected =
                                  cubicleAvailability.availableCubicles.find(
                                    (c: any) => c.id === selectedCubicleId,
                                  );

                                if (
                                  selected?.bookings &&
                                  selected.bookings.length > 0
                                ) {
                                  return (
                                    <div className="space-y-3">
                                      <div className="flex items-center gap-2 pb-3 border-b border-gray-200">
                                        <div className="h-2 w-2 bg-indigo-600 rounded-full animate-pulse"></div>
                                        <p className="text-xs font-medium text-gray-700 uppercase tracking-wide">
                                          {selected.bookings.length}{" "}
                                          {selected.bookings.length === 1
                                            ? "Booking"
                                            : "Bookings"}{" "}
                                          for {selected.name}
                                        </p>
                                      </div>
                                      {selected.bookings.map(
                                        (booking: any, idx: number) => (
                                          <div
                                            key={idx}
                                            className="group relative flex items-center gap-4 p-3 bg-white rounded-lg border border-gray-200 hover:border-indigo-300 hover:shadow-md transition-all duration-200"
                                          >
                                            {/* Booking Number Badge */}
                                            <div className="flex-shrink-0 h-8 w-8 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-full flex items-center justify-center shadow-sm">
                                              <span className="text-xs font-bold text-white">
                                                {idx + 1}
                                              </span>
                                            </div>

                                            {/* Time Icon */}
                                            <div className="flex-shrink-0 h-9 w-9 bg-blue-50 rounded-lg flex items-center justify-center border border-blue-100">
                                              <Clock className="h-4 w-4 text-blue-600" />
                                            </div>

                                            {/* Booking Details */}
                                            <div className="flex-1 min-w-0">
                                              <p className="text-sm font-semibold text-gray-900 mb-0.5">
                                                {formatTime(booking.startTime)}{" "}
                                                - {formatTime(booking.endTime)}
                                              </p>
                                              {booking.patientName && (
                                                <div className="flex items-center gap-1.5">
                                                  <User className="h-3 w-3 text-gray-400" />
                                                  <p className="text-xs text-gray-600 truncate">
                                                    {booking.patientName}
                                                  </p>
                                                </div>
                                              )}
                                            </div>

                                            {/* Status Badge */}
                                            <div className="flex-shrink-0">
                                              <Badge
                                                variant="outline"
                                                className="text-xs bg-emerald-50 text-emerald-700 border-emerald-200 font-medium"
                                              >
                                                Booked
                                              </Badge>
                                            </div>
                                          </div>
                                        ),
                                      )}
                                    </div>
                                  );
                                } else {
                                  return (
                                    <div className="text-center py-8">
                                      <div className="inline-flex h-16 w-16 bg-green-100 rounded-full items-center justify-center mb-3 shadow-sm">
                                        <CheckCircle className="h-9 w-9 text-green-600" />
                                      </div>
                                      <p className="text-sm font-medium text-gray-800 mb-1">
                                        No bookings yet for this cubicle
                                      </p>
                                      <p className="text-xs text-gray-500">
                                        {selected?.name} is completely free
                                        today
                                      </p>
                                      <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 bg-indigo-50 rounded-full">
                                        <div className="h-1.5 w-1.5 bg-indigo-600 rounded-full"></div>
                                        <p className="text-xs text-indigo-700 font-medium">
                                          Your appointment will be the first one
                                        </p>
                                      </div>
                                    </div>
                                  );
                                }
                              })()}
                            </div>
                          </div>
                        )}

                      {/* Warning if no cubicles available */}
                      {!cubicleAvailability.hasAvailability && (
                        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
                          <AlertCircle className="h-4 w-4" />
                          <span className="text-sm font-medium">
                            No cubicles available for this time slot. All rooms
                            are occupied.
                          </span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-gray-500">
                      <Info className="h-4 w-4" />
                      <span className="text-sm">
                        Select date and time to check cubicle availability
                      </span>
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
                therapistSchedule.length === 0
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

      {/* Calendar Dialog for Single Start Date Selection */}
      <Dialog
        open={isStartDateCalendarOpen}
        onOpenChange={setIsStartDateCalendarOpen}
      >
        <DialogContent className="max-w-md p-4">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-indigo-600" />
              Select {watchedValues.isRecurring ? "First Appointment" : "Appointment"} Date
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Month Navigation */}
            <div className="flex items-center justify-between">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  const newMonth = new Date(currentMonth);
                  newMonth.setMonth(newMonth.getMonth() - 1);
                  setCurrentMonth(newMonth);
                }}
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </Button>
              <div className="text-center">
                <h3 className="text-base font-semibold text-slate-800">
                  {currentMonth.toLocaleDateString("en-US", {
                    month: "long",
                    year: "numeric",
                  })}
                </h3>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  const newMonth = new Date(currentMonth);
                  newMonth.setMonth(newMonth.getMonth() + 1);
                  setCurrentMonth(newMonth);
                }}
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </Button>
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1 text-center text-sm">
              {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
                <div key={day} className="font-semibold text-gray-500">
                  {day}
                </div>
              ))}
              {(() => {
                const { daysInMonth, startingDayOfWeek, year, month } =
                  getDaysInMonth(currentMonth);
                const days = [];
                for (let i = 0; i < startingDayOfWeek; i++) {
                  days.push(<div key={`empty-${i}`} />);
                }
                for (let day = 1; day <= daysInMonth; day++) {
                  const date = new Date(year, month, day);
                  const dateStr = formatDateToString(date);
                  const isSelected = watchedValues.appointmentDate === dateStr;
                  const isPast = isPastDate(dateStr);
                  const isToday = dateStr === formatDateToString(new Date());

                  days.push(
                    <div key={day} className="p-1">
                      <button
                        type="button"
                        onClick={() => {
                          form.setValue("appointmentDate", dateStr);
                          setIsStartDateCalendarOpen(false);
                        }}
                        disabled={isPast}
                        className={`w-full h-9 rounded-md transition-colors
                          ${isPast ? "text-gray-400 cursor-not-allowed" : ""}
                          ${isSelected ? "bg-indigo-600 text-white" : "hover:bg-indigo-100"}
                          ${isToday && !isSelected ? "border-2 border-indigo-600" : ""}
                        `}
                      >
                        {day}
                      </button>
                    </div>,
                  );
                }
                return days;
              })()}
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsStartDateCalendarOpen(false)}
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Calendar Dialog for Custom Date Selection */}
      <Dialog open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
        <DialogContent className="max-w-md p-4">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-indigo-600" />
              Select Custom Dates
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Month Navigation */}
            <div className="flex items-center justify-between">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  const newMonth = new Date(currentMonth);
                  newMonth.setMonth(newMonth.getMonth() - 1);
                  setCurrentMonth(newMonth);
                }}
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </Button>
              <div className="text-center">
                <h3 className="text-base font-semibold text-slate-800">
                  {currentMonth.toLocaleDateString("en-US", {
                    month: "long",
                    year: "numeric",
                  })}
                </h3>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  const newMonth = new Date(currentMonth);
                  newMonth.setMonth(newMonth.getMonth() + 1);
                  setCurrentMonth(newMonth);
                }}
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </Button>
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1 text-center text-sm">
              {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
                <div key={day} className="font-semibold text-gray-500">
                  {day}
                </div>
              ))}
              {(() => {
                const { daysInMonth, startingDayOfWeek, year, month } =
                  getDaysInMonth(currentMonth);
                const days = [];
                for (let i = 0; i < startingDayOfWeek; i++) {
                  days.push(<div key={`empty-${i}`} />);
                }
                for (let day = 1; day <= daysInMonth; day++) {
                  const date = new Date(year, month, day);
                  const dateStr = formatDateToString(date);
                  const isSelected = isDateSelected(dateStr);
                  const isPast = isPastDate(dateStr);
                  const isToday = dateStr === formatDateToString(new Date());

                  days.push(
                    <div key={day} className="p-1">
                      <button
                        type="button"
                        onClick={() => !isPast && toggleDate(dateStr)}
                        disabled={isPast}
                        className={`w-full h-9 rounded-md transition-colors
                          ${isPast ? "text-gray-400 cursor-not-allowed" : ""}
                          ${isSelected ? "bg-indigo-600 text-white" : "hover:bg-indigo-100"}
                          ${isToday && !isSelected ? "border-2 border-indigo-600" : ""}
                        `}
                      >
                        {day}
                      </button>
                    </div>,
                  );
                }
                return days;
              })()}
            </div>

            {/* Selected Dates Summary */}
            {customDates.length > 0 && (
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label>
                    {customDates.length}{" "}
                    {customDates.length === 1 ? "date" : "dates"} selected
                  </Label>
                  <Button
                    variant="link"
                    size="sm"
                    onClick={() => setCustomDates([])}
                  >
                    Clear
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto p-2 border rounded-md">
                  {customDates.sort().map((date) => (
                    <Badge
                      key={date}
                      variant="secondary"
                      className="flex items-center gap-2"
                    >
                      {new Date(date).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                      })}
                      <button
                        type="button"
                        onClick={() =>
                          setCustomDates(customDates.filter((d) => d !== date))
                        }
                        className="text-gray-500 hover:text-red-500"
                      >
                        <XCircle className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCalendarOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => setIsCalendarOpen(false)}
              disabled={customDates.length === 0}
            >
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Calendar Dialog for Single End Date Selection */}
      <Dialog
        open={isEndDateCalendarOpen}
        onOpenChange={setIsEndDateCalendarOpen}
      >
        <DialogContent className="max-w-md p-4">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-indigo-600" />
              Select End Date
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Month Navigation */}
            <div className="flex items-center justify-between">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  const newMonth = new Date(currentMonth);
                  newMonth.setMonth(newMonth.getMonth() - 1);
                  setCurrentMonth(newMonth);
                }}
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </Button>
              <div className="text-center">
                <h3 className="text-base font-semibold text-slate-800">
                  {currentMonth.toLocaleDateString("en-US", {
                    month: "long",
                    year: "numeric",
                  })}
                </h3>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  const newMonth = new Date(currentMonth);
                  newMonth.setMonth(newMonth.getMonth() + 1);
                  setCurrentMonth(newMonth);
                }}
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </Button>
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1 text-center text-sm">
              {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
                <div key={day} className="font-semibold text-gray-500">
                  {day}
                </div>
              ))}
              {(() => {
                const { daysInMonth, startingDayOfWeek, year, month } =
                  getDaysInMonth(currentMonth);
                const days = [];
                for (let i = 0; i < startingDayOfWeek; i++) {
                  days.push(<div key={`empty-${i}`} />);
                }
                for (let day = 1; day <= daysInMonth; day++) {
                  const date = new Date(year, month, day);
                  const dateStr = formatDateToString(date);
                  const isSelected = watchedValues.recurringEndDate === dateStr;
                  const isPast =
                    isPastDate(dateStr) ||
                    (watchedValues.appointmentDate
                      ? dateStr < watchedValues.appointmentDate
                      : false);
                  const isToday = dateStr === formatDateToString(new Date());

                  days.push(
                    <div key={day} className="p-1">
                      <button
                        type="button"
                        onClick={() => {
                          form.setValue("recurringEndDate", dateStr);
                          setIsEndDateCalendarOpen(false);
                        }}
                        disabled={isPast}
                        className={`w-full h-9 rounded-md transition-colors
                          ${isPast ? "text-gray-400 cursor-not-allowed" : ""}
                          ${isSelected ? "bg-indigo-600 text-white" : "hover:bg-indigo-100"}
                          ${isToday && !isSelected ? "border-2 border-indigo-600" : ""}
                        `}
                      >
                        {day}
                      </button>
                    </div>,
                  );
                }
                return days;
              })()}
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEndDateCalendarOpen(false)}
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}
