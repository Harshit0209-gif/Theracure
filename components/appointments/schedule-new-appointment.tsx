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
  Layers,
  BriefcaseMedical,
  PlusCircle,
  FileText,
  ChevronRight,
  ClipboardList,
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
import {
  getDaysInMonthData,
  formatDateToString,
  isPastDate,
} from "@/components/ui/date-picker-dialog";
import { DatePickerButton } from "@/components/ui/date-picker-button";
import { TimeInput } from "@/components/ui/time-input";

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
  const [isEndDateCalendarOpen, setIsEndDateCalendarOpen] = useState(false);

  const [isGeneratingPreview, setIsGeneratingPreview] = useState(false);
  const [cubicleAvailability, setCubicleAvailability] = useState<any>(null);
  const [isCheckingCubicles, setIsCheckingCubicles] = useState(false);
  const [selectedCubicleId, setSelectedCubicleId] = useState<string>("");
  const [isLoadingPatients, setIsLoadingPatients] = useState(false);
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

  // Sync customDates state with form data
  useEffect(() => {
    if (customDates.length > 0) {
      form.setValue("customDates", customDates);
    } else {
      form.setValue("customDates", undefined);
    }
  }, [customDates]);

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
      handlePatientSearch(""); // Load initial patient list
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
    setIsLoadingPatients(true);
    try {
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
    } finally {
      setIsLoadingPatients(false);
    }
  }, 300);

  const fetchTherapists = async () => {
    try {
      const response = await fetch("/api/therapists?status=active");
      const data = await response.json();
      if (data.success) {
        setTherapists(data.therapists);
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
                  : (recurringCount - 1) * 28;

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

  // Calendar state
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const isDateSelected = (dateStr: string) => customDates.includes(dateStr);

  const toggleDate = (dateStr: string) => {
    if (isDateSelected(dateStr)) {
      setCustomDates(customDates.filter((d) => d !== dateStr));
    } else {
      setCustomDates([...customDates, dateStr]);
    }
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
      const errors = validationResult.error.issues;
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
      <DialogContent className="max-w-6xl max-h-[95vh] overflow-y-auto p-0 gap-0 border-none shadow-2xl">
        {/* Header Section */}
        <div className="bg-white p-6 border-b-4 border-indigo-600 sticky top-0 z-20 shadow-sm">
          <div className="flex items-center justify-between">
            <DialogHeader className="space-y-1">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-indigo-100 flex items-center justify-center">
                  <CalendarDays className="h-5 w-5 text-indigo-700" />
                </div>
                <div>
                  <DialogTitle className="text-xl font-semibold text-gray-800">
                    Schedule New Appointment
                  </DialogTitle>
                  <DialogDescription className="text-gray-600 text-sm">
                    Plan sessions, assign specialists, and manage room
                    allocations
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>
            <Badge className="bg-indigo-600 text-white hover:bg-indigo-700 px-3 py-1">
              New Booking
            </Badge>
          </div>
        </div>

        <div className="p-0 bg-slate-50/50">
          {serverError && (
            <div className="m-6 bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded shadow-sm flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-300">
              <AlertCircle className="h-5 w-5 text-red-500" />
              <p className="font-semibold text-sm">{serverError}</p>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 min-h-[600px]">
            {/* Left Column: Form Configuration */}
            <div className="lg:col-span-7 p-6 lg:p-8 space-y-10 bg-white border-r border-slate-100">
              {/* Section 1: Patient & Service */}
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-indigo-50 flex items-center justify-center">
                    <User className="h-4 w-4 text-indigo-600" />
                  </div>
                  <h3 className="font-bold text-sm text-indigo-600 uppercase tracking-wider">
                    Patient & Service
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label
                      htmlFor="patientId"
                      className="text-sm font-bold text-slate-700 flex items-center justify-between"
                    >
                      Patient Details
                      <span className="text-[10px] text-indigo-500 font-black uppercase tracking-tighter">
                        * Required
                      </span>
                    </Label>
                    <div className="relative group shadow-sm transition-shadow hover:shadow-md rounded-md border border-slate-200">
                      <ReactSelect
                        options={patientOptions}
                        onChange={(selectedOption: any) =>
                          form.setValue(
                            "patientId",
                            selectedOption?.value || "",
                          )
                        }
                        onInputChange={(inputValue, actionMeta) => {
                          // Always trigger search, even with empty input
                          if (actionMeta.action === "input-change") {
                            handlePatientSearch(inputValue || "");
                          }
                        }}
                        placeholder="Search patient name or ID..."
                        isSearchable
                        isLoading={isLoadingPatients}
                        loadingMessage={() => "Searching patients..."}
                        noOptionsMessage={() => "No patients found"}
                        className="react-select-container"
                        classNamePrefix="react-select"
                        styles={{
                          control: (base) => ({
                            ...base,
                            border: "none",
                            boxShadow: "none",
                            backgroundColor: "transparent",
                            minHeight: "40px",
                          }),
                          placeholder: (base) => ({
                            ...base,
                            color: "#94a3b8",
                            fontSize: "14px",
                            fontWeight: "500",
                          }),
                          input: (base) => ({
                            ...base,
                            color: "#1e293b",
                            fontSize: "14px",
                            fontWeight: "600",
                          }),
                          singleValue: (base) => ({
                            ...base,
                            color: "#1e293b",
                            fontSize: "14px",
                            fontWeight: "600",
                          }),
                          menu: (base) => ({
                            ...base,
                            zIndex: 100,
                            borderRadius: "12px",
                            overflow: "hidden",
                            border: "1px solid #e2e8f0",
                            boxShadow:
                              "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
                          }),
                          option: (base, state) => ({
                            ...base,
                            backgroundColor: state.isFocused
                              ? "#f5f3ff"
                              : "white",
                            color: state.isSelected ? "#4f46e5" : "#475569",
                            fontWeight: state.isSelected ? "700" : "500",
                            fontSize: "13px",
                            cursor: "pointer",
                            "&:active": {
                              backgroundColor: "#e0e7ff",
                            },
                          }),
                          loadingIndicator: (base) => ({
                            ...base,
                            color: "#4f46e5",
                          }),
                          loadingMessage: (base) => ({
                            ...base,
                            color: "#64748b",
                            fontSize: "13px",
                            fontWeight: "600",
                            padding: "8px 12px",
                          }),
                        }}
                      />
                    </div>
                    {form.formState.errors.patientId && (
                      <p className="text-[11px] text-red-500 font-bold mt-1.5 flex items-center gap-1 uppercase tracking-tight">
                        <AlertCircle className="h-3 w-3" />{" "}
                        {form.formState.errors.patientId.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="serviceCategory"
                      className="text-sm font-bold text-slate-700"
                    >
                      Service Category
                    </Label>
                    <Select
                      onValueChange={(value) =>
                        form.setValue(
                          "serviceCategory",
                          value as ServiceCategory,
                        )
                      }
                    >
                      <SelectTrigger className="bg-slate-50 border-slate-200 h-10 hover:border-indigo-300 transition-colors">
                        <div className="flex items-center gap-2">
                          <Layers className="h-4 w-4 text-slate-400" />
                          <SelectValue placeholder="Filter by category" />
                        </div>
                      </SelectTrigger>
                      <SelectContent>
                        {serviceCategories.map((category) => (
                          <SelectItem key={category} value={category}>
                            {ServiceCategoryLabel[category]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {watchedValues.serviceCategory && (
                  <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                    <Label
                      htmlFor="serviceId"
                      className="text-sm font-bold text-slate-700"
                    >
                      Treatment Plan / Service
                    </Label>
                    <Select
                      onValueChange={(value) =>
                        form.setValue("serviceId", value)
                      }
                    >
                      <SelectTrigger className="bg-slate-50 border-slate-200 h-11 hover:border-indigo-300 transition-colors shadow-sm">
                        <div className="flex items-center gap-2">
                          <Activity className="h-4 w-4 text-indigo-500" />
                          <SelectValue
                            placeholder={`Select ${ServiceCategoryLabel[watchedValues.serviceCategory]} treatment plan`}
                          />
                        </div>
                      </SelectTrigger>
                      <SelectContent>
                        {filteredServices.map((service) => (
                          <SelectItem
                            key={service.id}
                            value={service.id.toString()}
                          >
                            <div className="flex justify-between items-center w-full gap-8">
                              <span className="font-medium">
                                {service.name}
                              </span>
                              <Badge
                                variant="secondary"
                                className="bg-indigo-100 text-indigo-700 hover:bg-indigo-200 border-none px-2 font-bold"
                              >
                                ₹{service.price}
                              </Badge>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              {/* Section 2: Timing & Therapist */}
              <div className="space-y-6 pt-4 border-t border-slate-50">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-indigo-50 flex items-center justify-center">
                    <Clock className="h-4 w-4 text-indigo-600" />
                  </div>
                  <h3 className="font-bold text-sm text-indigo-600 uppercase tracking-wider">
                    Schedule & Specialist
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <DatePickerButton
                      label={watchedValues.isRecurring ? "Start Date" : "Booking Date"}
                      value={watchedValues.appointmentDate}
                      onChange={(date) => form.setValue("appointmentDate", date)}
                      title={watchedValues.isRecurring ? "Select First Appointment Date" : "Select Appointment Date"}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="therapistId"
                      className="text-sm font-bold text-slate-700"
                    >
                      Assign Therapist
                    </Label>
                    <Select
                      onValueChange={(value) =>
                        form.setValue("therapistId", value)
                      }
                    >
                      <SelectTrigger className="bg-slate-50 border-slate-200 h-11 hover:border-indigo-300 transition-colors shadow-sm">
                        <div className="flex items-center gap-2">
                          <BriefcaseMedical className="h-4 w-4 text-slate-400" />
                          <SelectValue placeholder="Choose specialist" />
                        </div>
                      </SelectTrigger>
                      <SelectContent>
                        {therapists.map((therapist: any) => (
                          <SelectItem key={therapist.id} value={therapist.id}>
                            <div className="flex items-center gap-2">
                              <div className="h-5 w-5 rounded-full bg-indigo-100 flex items-center justify-center text-[10px] font-bold text-indigo-700">
                                {therapist.name.charAt(0)}
                              </div>
                              {therapist.name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <TimeInput
                    id="startTime"
                    label="Start Time"
                    value={watchedValues.startTime || ""}
                    onChange={(val) => {
                      form.setValue("startTime", val);
                      if (watchedValues.endTime && val >= watchedValues.endTime) {
                        form.setValue("endTime", "");
                      }
                    }}
                  />
                  <TimeInput
                    id="endTime"
                    label="End Time"
                    value={watchedValues.endTime || ""}
                    onChange={(val) => form.setValue("endTime", val)}
                    disabled={!watchedValues.startTime}
                    min={watchedValues.startTime || undefined}
                  />
                </div>
              </div>

              {/* Section 3: Recurrence Plan */}
              <div className="pt-2">
                <div
                  className={`p-5 rounded-2xl border transition-all duration-300 ${watchedValues.isRecurring ? "bg-indigo-50/30 border-indigo-200 shadow-inner" : "bg-slate-50/50 border-slate-200"}`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={`h-8 w-8 rounded-lg flex items-center justify-center transition-colors ${watchedValues.isRecurring ? "bg-indigo-600 text-white" : "bg-slate-200 text-slate-500"}`}
                      >
                        <Repeat className="h-4 w-4" />
                      </div>
                      <div>
                        <h3 className="font-bold text-sm text-slate-800 uppercase tracking-tight">
                          Recurrence Plan
                        </h3>
                        <p className="text-[10px] text-slate-500 font-medium">
                          Automatic series generation
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full border shadow-sm ring-1 ring-slate-100">
                      <Checkbox
                        id="isRecurring"
                        checked={watchedValues.isRecurring}
                        onCheckedChange={(checked) =>
                          form.setValue("isRecurring", checked as boolean)
                        }
                        className="data-[state=checked]:bg-indigo-600 border-slate-300"
                      />
                      <Label
                        htmlFor="isRecurring"
                        className="text-[11px] font-black text-indigo-600 uppercase tracking-widest cursor-pointer select-none"
                      >
                        Enabled
                      </Label>
                    </div>
                  </div>

                  {watchedValues.isRecurring && (
                    <div className="space-y-5 animate-in fade-in zoom-in-95 duration-300">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <Label className="text-[10px] font-black text-indigo-400 uppercase ml-1">
                            Pattern
                          </Label>
                          <Select
                            value={watchedValues.recurringType}
                            onValueChange={(value) => {
                              form.setValue(
                                "recurringType",
                                value as RecurringType,
                              );
                              if (value !== RecurringType.CUSTOM)
                                setCustomDates([]);
                            }}
                          >
                            <SelectTrigger className="bg-white border-indigo-100 h-10 shadow-sm font-semibold">
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value={RecurringType.DAILY}>
                                Daily Sequence
                              </SelectItem>
                              <SelectItem value={RecurringType.WEEKLY}>
                                Weekly Repeat
                              </SelectItem>
                              <SelectItem value={RecurringType.BIWEEKLY}>
                                Fortnightly
                              </SelectItem>
                              <SelectItem value={RecurringType.MONTHLY}>
                                Monthly Cycle
                              </SelectItem>
                              <SelectItem value={RecurringType.CUSTOM}>
                                Manual Selection
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {watchedValues.recurringType !==
                          RecurringType.CUSTOM && (
                          <div className="space-y-1.5">
                            <Label className="text-[10px] font-black text-indigo-400 uppercase ml-1">
                              Termination
                            </Label>
                            <Select
                              value={watchedValues.recurringEndType}
                              onValueChange={(value) =>
                                form.setValue(
                                  "recurringEndType",
                                  value as RecurringEndType,
                                )
                              }
                            >
                              <SelectTrigger className="bg-white border-indigo-100 h-10 shadow-sm font-semibold">
                                <SelectValue placeholder="End method" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value={RecurringEndType.COUNT}>
                                  Session Count
                                </SelectItem>
                                <SelectItem value={RecurringEndType.DATE}>
                                  Fixed End Date
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        )}
                      </div>

                      {watchedValues.recurringType === RecurringType.CUSTOM && (
                        <div className="p-4 bg-white/80 backdrop-blur-sm rounded-xl border border-indigo-100 shadow-sm space-y-3">
                          <div className="flex items-center justify-between">
                            <Label className="text-sm font-extrabold text-indigo-900">
                              Manual Date List
                            </Label>
                            <Button
                              type="button"
                              size="sm"
                              onClick={() => setIsCalendarOpen(true)}
                              className="bg-indigo-600 hover:bg-indigo-700 shadow-md h-8 text-[11px] font-black uppercase tracking-wider"
                            >
                              <PlusCircle className="h-3.5 w-3.5 mr-1.5" />
                              Manage Dates
                            </Button>
                          </div>
                          {customDates.length > 0 ? (
                            <div className="flex flex-wrap gap-2 pt-1 max-h-[80px] overflow-y-auto pr-2">
                              {customDates.sort().map((date, idx) => (
                                <Badge
                                  key={idx}
                                  variant="secondary"
                                  className="bg-indigo-50/80 text-indigo-700 border-indigo-100 py-1 font-bold text-[10px]"
                                >
                                  {new Date(date).toLocaleDateString("en-IN", {
                                    day: "2-digit",
                                    month: "short",
                                  })}
                                </Badge>
                              ))}
                            </div>
                          ) : (
                            <div className="flex flex-col items-center py-2 gap-1 text-slate-400">
                              <Calendar className="h-5 w-5 opacity-30" />
                              <p className="text-[10px] font-bold uppercase tracking-widest italic">
                                Pick dates manually
                              </p>
                            </div>
                          )}
                        </div>
                      )}

                      {watchedValues.recurringType !== RecurringType.CUSTOM && (
                        <div className="animate-in fade-in slide-in-from-left-2 duration-300">
                          {watchedValues.recurringEndType ===
                          RecurringEndType.COUNT ? (
                            <div className="space-y-1.5">
                              <Label className="text-[10px] font-black text-indigo-400 uppercase ml-1">
                                Total Occurrences
                              </Label>
                              <div className="relative">
                                <Input
                                  type="number"
                                  min="1"
                                  max="52"
                                  {...form.register("recurringCount", {
                                    valueAsNumber: true,
                                  })}
                                  placeholder="Enter number of sessions (max 52)"
                                  className="bg-white border-indigo-100 h-10 font-bold"
                                />
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-indigo-300 uppercase">
                                  Sessions
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-1.5">
                              <Label className="text-[10px] font-black text-indigo-400 uppercase ml-1">
                                Final Session Date
                              </Label>
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsEndDateCalendarOpen(true)}
                                className="w-full flex justify-between items-center bg-white border-indigo-100 h-10 px-4 font-bold shadow-sm"
                              >
                                <span
                                  className={
                                    watchedValues.recurringEndDate
                                      ? "text-slate-900"
                                      : "text-slate-400"
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
                                    : "Pick end date..."}
                                </span>
                                <Calendar className="h-4 w-4 text-indigo-400" />
                              </Button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Section 4: Notes */}
              <div className="space-y-2 pt-2">
                <Label
                  htmlFor="notes"
                  className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2"
                >
                  <FileText className="h-3.5 w-3.5 text-slate-400" />
                  Internal Clinical Notes
                </Label>
                <Textarea
                  id="notes"
                  placeholder="Mention special physical requirements, allergies, or therapist instructions..."
                  {...form.register("notes")}
                  className="min-h-[100px] bg-slate-50/50 border-slate-200 focus:bg-white transition-all text-sm leading-relaxed"
                />
              </div>
            </div>

            {/* Right Column: Dynamic Status & Context */}
            <div className="lg:col-span-5 bg-slate-50/80 p-6 lg:p-8 space-y-8">
              <div className="sticky top-[100px] space-y-8">
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-1 w-8 bg-indigo-600 rounded-full"></div>
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                    Context & Selection
                  </h4>
                </div>

                {/* Selected Service Card */}
                {selectedService ? (
                  <Card className="border-none shadow-md overflow-hidden bg-white ring-1 ring-indigo-50 animate-in fade-in zoom-in-95 duration-300">
                    <div className="bg-indigo-600 px-4 py-2 flex items-center justify-between">
                      <p className="text-[10px] font-black text-white/80 uppercase tracking-widest">
                        Active Plan
                      </p>
                      <Badge className="bg-white/20 text-white border-none text-[9px] font-black">
                        ID: #{selectedService.id.toString().slice(-4)}
                      </Badge>
                    </div>
                    <CardContent className="p-5 space-y-4">
                      <div className="space-y-1">
                        <h5 className="text-xl font-black text-slate-900 leading-tight">
                          {selectedService.name}
                        </h5>
                        <p className="text-xs font-bold text-indigo-600/70 uppercase tracking-tighter">
                          {ServiceCategoryLabel[selectedService.category]}
                        </p>
                      </div>

                      <div className="flex items-baseline gap-1 bg-slate-50 p-3 rounded-xl border border-slate-100">
                        <span className="text-xs font-bold text-slate-500 uppercase">
                          Rate:
                        </span>
                        <span className="text-2xl font-black text-slate-900 ml-auto">
                          ₹{selectedService.price}
                        </span>
                      </div>

                      {selectedService.description && (
                        <div className="bg-amber-50/50 p-3 rounded-xl border border-amber-100/50">
                          <p className="text-[11px] text-slate-600 font-medium italic leading-relaxed">
                            "{selectedService.description}"
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ) : (
                  <div className="border-2 border-dashed border-slate-200 rounded-2xl p-10 flex flex-col items-center justify-center text-center space-y-3 opacity-60 bg-white/50">
                    <ClipboardList className="h-10 w-10 text-slate-300" />
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest leading-relaxed">
                      Choose a treatment
                      <br />
                      to see details
                    </p>
                  </div>
                )}

                {/* Duration Status */}
                {watchedValues.startTime && watchedValues.endTime && (
                  <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4 animate-in zoom-in-95 duration-300">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-2xl bg-emerald-500 flex items-center justify-center text-white shrink-0 shadow-lg shadow-emerald-100 ring-4 ring-emerald-50">
                        <Clock className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-0.5">
                          Session Window
                        </p>
                        <p className="text-lg font-black text-slate-900 leading-none tracking-tight">
                          {formatTime(watchedValues.startTime)}{" "}
                          <span className="text-slate-300 text-sm mx-1">→</span>{" "}
                          {formatTime(watchedValues.endTime)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between bg-emerald-50/50 px-4 py-2 rounded-lg border border-emerald-100/50">
                      <span className="text-xs font-bold text-emerald-700">
                        Total Duration
                      </span>
                      <Badge className="bg-emerald-600 font-black px-2 py-0.5 h-auto text-[10px]">
                        {calculateDuration(
                          watchedValues.startTime,
                          watchedValues.endTime,
                        )}{" "}
                        MIN
                      </Badge>
                    </div>
                  </div>
                )}

                {/* Specialist Status */}
                {watchedValues.therapistId && watchedValues.appointmentDate && (
                  <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm overflow-hidden">
                    {isCheckingAvailability ? (
                      <div className="flex items-center gap-3 py-2">
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-indigo-600 border-t-transparent" />
                        <span className="text-xs font-black text-slate-400 uppercase tracking-widest">
                          Checking Specialist...
                        </span>
                      </div>
                    ) : therapistSchedule.length > 0 ? (
                      <div className="space-y-4">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center text-green-600 shadow-inner">
                            <CheckCircle className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="text-xs font-black text-green-800 uppercase tracking-tighter">
                              Specialist Ready
                            </p>
                            <p className="text-[10px] text-slate-500 font-bold uppercase">
                              {getDayName(watchedValues.appointmentDate)}
                            </p>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 gap-2">
                          {therapistSchedule.map((slot, i) => (
                            <div
                              key={i}
                              className="bg-slate-50 rounded-xl p-2.5 border border-slate-100 flex items-center justify-between"
                            >
                              <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">
                                Duty Shift
                              </span>
                              <span className="text-[11px] font-bold text-slate-700 tracking-tight">
                                {formatTime(slot.startTime)} -{" "}
                                {formatTime(slot.endTime)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-4 py-2">
                        <div className="h-10 w-10 rounded-full bg-red-50 flex items-center justify-center text-red-500 shadow-inner">
                          <XCircle className="h-6 w-6" />
                        </div>
                        <div>
                          <p className="text-xs font-black text-red-800 uppercase leading-none">
                            Not Available
                          </p>
                          <p className="text-[10px] text-red-600/70 font-bold uppercase mt-1">
                            Select another slot
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Cubicle Selection Dashboard */}
                {watchedValues.appointmentDate &&
                  watchedValues.startTime &&
                  watchedValues.endTime && (
                    <div className="space-y-4 animate-in fade-in duration-500">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs font-black text-slate-500 uppercase tracking-[0.15em]">
                          Room Allocation
                        </Label>
                        {cubicleAvailability && (
                          <Badge
                            variant="outline"
                            className="text-[9px] font-black border-indigo-200 text-indigo-600 bg-indigo-50 px-2 py-0.5 uppercase"
                          >
                            {cubicleAvailability.availableCount} OPEN
                          </Badge>
                        )}
                      </div>

                      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-5">
                        {isCheckingCubicles ? (
                          <div className="flex flex-col items-center py-6 gap-3 text-slate-400">
                            <div className="animate-spin rounded-full h-8 w-8 border-4 border-indigo-100 border-t-indigo-600" />
                            <span className="text-[10px] font-black uppercase tracking-[0.2em]">
                              Scanning Rooms...
                            </span>
                          </div>
                        ) : cubicleAvailability ? (
                          <div className="space-y-5">
                            <div className="grid grid-cols-3 gap-3">
                              {cubicleAvailability.availableCubicles.map(
                                (cubicle: any) => (
                                  <button
                                    key={cubicle.id}
                                    type="button"
                                    onClick={() =>
                                      setSelectedCubicleId(cubicle.id)
                                    }
                                    className={`group relative p-3 rounded-2xl text-[10px] font-black transition-all border-2 flex flex-col items-center justify-center gap-2 h-[70px] ${
                                      selectedCubicleId === cubicle.id
                                        ? "bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-200 scale-105"
                                        : "bg-white text-slate-700 border-slate-100 hover:border-indigo-200 hover:bg-slate-50"
                                    }`}
                                  >
                                    <Home
                                      className={`h-5 w-5 transition-transform group-hover:scale-110 ${selectedCubicleId === cubicle.id ? "text-white" : "text-indigo-500 opacity-60"}`}
                                    />
                                    <span className="truncate w-full text-center uppercase tracking-tighter">
                                      {cubicle.name}
                                    </span>
                                    {selectedCubicleId === cubicle.id && (
                                      <div className="absolute -top-1.5 -right-1.5 h-5 w-5 bg-white rounded-full flex items-center justify-center border-2 border-indigo-600 shadow-sm animate-in zoom-in duration-300">
                                        <CheckCircle className="h-3 w-3 text-indigo-600" />
                                      </div>
                                    )}
                                  </button>
                                ),
                              )}
                              {cubicleAvailability.occupiedCubicles.map(
                                (cubicle: any) => (
                                  <button
                                    key={cubicle.id}
                                    disabled
                                    className="p-3 rounded-2xl text-[10px] font-black bg-slate-50 text-slate-300 border-2 border-slate-100 opacity-40 cursor-not-allowed flex flex-col items-center justify-center gap-2 h-[70px]"
                                  >
                                    <XCircle className="h-5 w-5 text-slate-200" />
                                    <span className="truncate w-full text-center uppercase tracking-tighter font-bold">
                                      {cubicle.name}
                                    </span>
                                  </button>
                                ),
                              )}
                            </div>

                            {selectedCubicleId && (
                              <div className="p-4 rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-100 animate-in slide-in-from-bottom-2 duration-300">
                                {(() => {
                                  const cubicle =
                                    cubicleAvailability.availableCubicles.find(
                                      (c: any) => c.id === selectedCubicleId,
                                    );
                                  return cubicle ? (
                                    <div className="flex items-center gap-4">
                                      <div className="h-12 w-12 rounded-xl bg-white/20 flex items-center justify-center shrink-0 border border-white/10">
                                        <Home className="h-6 w-6 text-white" />
                                      </div>
                                      <div className="flex-1">
                                        <p className="text-[10px] font-black text-white/60 uppercase tracking-[0.2em] mb-0.5">
                                          Assigned Space
                                        </p>
                                        <div className="flex items-center justify-between">
                                          <h6 className="text-sm font-black leading-none">
                                            {cubicle.name}
                                          </h6>
                                          <p className="text-[10px] font-bold bg-white/20 px-2 rounded tracking-tighter uppercase">
                                            {cubicle.location || "Central Wing"}
                                          </p>
                                        </div>
                                      </div>
                                    </div>
                                  ) : null;
                                })()}
                              </div>
                            )}
                          </div>
                        ) : null}
                      </div>
                    </div>
                  )}

                {/* Recurring Schedule Preview Section */}
                {watchedValues.isRecurring && recurringPreview.length > 0 && (
                  <div className="space-y-3 animate-in slide-in-from-right-4 duration-500">
                    <div className="flex items-center justify-between px-1">
                      <Label className="text-xs font-black text-slate-500 uppercase tracking-widest">
                        Series Preview
                      </Label>
                      <Badge className="bg-violet-600 font-black px-2 text-[10px] uppercase">
                        {recurringPreview.length} Sessions
                      </Badge>
                    </div>
                    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm shadow-indigo-50">
                      <div className="max-h-[180px] overflow-y-auto">
                        {recurringPreview.slice(0, 5).map((item, i) => (
                          <div
                            key={i}
                            className="group flex items-center gap-4 p-3 border-b border-slate-50 last:border-0 hover:bg-indigo-50/30 transition-colors"
                          >
                            <div className="h-7 w-7 rounded-lg bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-400 group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-colors">
                              #{i + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-black text-slate-800 truncate leading-none uppercase tracking-tight">
                                {item.dayName}
                              </p>
                              <p className="text-[10px] text-slate-500 font-bold mt-1 uppercase tracking-tighter opacity-70">
                                {item.formattedDate}
                              </p>
                            </div>
                            <ChevronRight className="h-3 w-3 text-slate-300 group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all" />
                          </div>
                        ))}
                        {recurringPreview.length > 5 && (
                          <div className="p-3 text-center bg-slate-50/50">
                            <button
                              type="button"
                              className="text-[9px] font-black text-indigo-600 hover:text-indigo-800 uppercase tracking-[0.2em] transition-all"
                            >
                              + {recurringPreview.length - 5} More Appointments
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Action Footer Section */}
        <DialogFooter className="p-6 bg-white border-t border-slate-100 sticky bottom-0 z-30 sm:justify-between items-center gap-6 shadow-[0_-4px_20px_rgba(0,0,0,0.03)]">
          <div className="hidden md:flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center">
              <Info className="h-4 w-4 text-slate-400" />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5 leading-none">
                Compliance Check
              </p>
              <p className="text-[11px] text-slate-600 font-bold leading-none">
                Ensure timing matches specialist shift
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 w-full sm:w-auto">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="flex-1 sm:flex-none px-8 font-black uppercase text-[11px] tracking-widest text-slate-500 hover:text-red-600 hover:bg-red-50/50 transition-all h-12 rounded-xl"
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
              className="flex-1 sm:flex-none bg-indigo-600 hover:bg-indigo-700 h-12 px-10 rounded-xl font-black uppercase text-[11px] tracking-[0.15em] text-white shadow-xl shadow-indigo-200 transition-all active:scale-95 disabled:bg-slate-200 disabled:shadow-none disabled:text-slate-400 group"
            >
              {isLoading ? (
                <div className="flex items-center gap-3">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                  <span>Processing...</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span>
                    {watchedValues.isRecurring
                      ? "Initialize Series"
                      : "Finalize Booking"}
                  </span>
                  <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </div>
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>

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
                  getDaysInMonthData(currentMonth);
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
                  getDaysInMonthData(currentMonth);
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
