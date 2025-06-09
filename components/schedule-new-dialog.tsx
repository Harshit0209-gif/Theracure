import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/auth-context";
import {
  Clock,
  User,
  Calendar,
  Activity,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react";

const MAX_YEAR = new Date().getFullYear() + 1;
const appointmentSchema = z.object({
  patientId: z.string().min(1, "Please select a patient"),
  therapistId: z.string().min(1, "Please select a therapist"),
  appointmentDate: z.string().refine(
    (dateStr) => {
      const date = new Date(dateStr);
      const year = date.getFullYear();
      return year <= MAX_YEAR && !isNaN(date.getTime());
    },
    {
      message: "Please enter a valid date within the next year.",
    }
  ),
  startTime: z.string().min(1, "Please select start time"),
  endTime: z.string().min(1, "Please select end time"),
  serviceCategory: z.string().min(1, "Please select a service category"),
  serviceId: z.string().min(1, "Please select a service"),
  notes: z.string().optional(),
});

type AppointmentFormData = z.infer<typeof appointmentSchema>;

interface ScheduleNewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAppointmentCreated: () => void;
}

interface Service {
  id: string;
  name: string;
  category: string;
  price: number;
  description?: string;
  isActive?: boolean;
}

interface AvailablePeriod {
  startTime: string;
  endTime: string;
  available: boolean;
  duration?: number;
}

interface TherapistAvailability {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

export function ScheduleNewDialog({
  open,
  onOpenChange,
  onAppointmentCreated,
}: ScheduleNewDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [patients, setPatients] = useState([]);
  const [therapists, setTherapists] = useState([]);
  const [services, setServices] = useState<Service[]>([]);
  const [serviceCategories, setServiceCategories] = useState<string[]>([]);
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
  const { user } = useAuth();

  const form = useForm<AppointmentFormData>({
    resolver: zodResolver(appointmentSchema),
    defaultValues: {
      patientId: "",
      therapistId: "",
      appointmentDate: "",
      startTime: "",
      endTime: "",
      serviceCategory: "",
      serviceId: "",
      notes: "",
    },
  });

  const watchedValues = form.watch();

  // Fetch initial data when dialog opens
  useEffect(() => {
    if (open) {
      fetchPatients();
      fetchTherapists();
      fetchServices();
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
    // Reset service selection when category changes
    form.setValue("serviceId", "");
    setSelectedService(null);
  }, [watchedValues.serviceCategory, services]);

  // Update selected service details
  useEffect(() => {
    if (watchedValues.serviceId) {
      const service = services.find((s) => s.id === watchedValues.serviceId);
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

  const fetchServices = async () => {
    try {
      const response = await fetch("/api/services");
      const data = await response.json();
      if (data.success) {
        const fetchedServices: Service[] = (data.data || []).map(
          (service: any) => ({
            id: service.id,
            name: service.name,
            price: service.price,
            category: service.category,
            description: service.description,
            isActive: service.isActive,
          })
        );

        setServices(fetchedServices);
        console.log("Fetched services: ", fetchedServices);
        console.log("Asssign services data: ", services);

        const categories: string[] = [
          ...new Set(
            fetchedServices.map((service: Service) => service.category)
          ),
        ];

        setServiceCategories(categories);
        console.log("Service categories: ", categories);
      }
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
      const appointmentDate =
        appointmentSchema.shape.appointmentDate.safeParse(date);
      console.log(
        "Checking availability for therapist:",
        therapistId,
        "on date:",
        date
      );
      // Fetch therapist's working schedule
      const therapistResponse = await fetch(
        `/api/therapists/${therapistId}/availability?date=${appointmentDate.data}`
      );
      const therapistData = await therapistResponse.json();
      console.log(
        "Therapist therapist's working schedule fetch from api: ",
        therapistData
      );

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
          reason: period.reason || "",
        }));
      setAvailablePeriods(availablePeriods);

      console.log("Available periods: ", availablePeriods);
      console.log("Therapist schedule in weakday: ", therapistSchedule);
    } catch (error) {
      console.error("Error checking availability:", error);
    } finally {
      setIsCheckingAvailability(false);
    }
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(":");
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? "PM" : "AM";
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const getDayName = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", { weekday: "long" });
  };

  const calculateDuration = (startTime: string, endTime: string) => {
    const start = new Date(`2000-01-01T${startTime}:00`);
    const end = new Date(`2000-01-01T${endTime}:00`);
    return Math.round((end.getTime() - start.getTime()) / (1000 * 60));
  };

  //create new appointment- POST api call
  const onSubmit = async (data: AppointmentFormData) => {
    console.log("Form data submitted--:", data);
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to schedule an appointment",
        variant: "destructive",
      });
      return;
    }

    // Validate time slot availability
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

    console.log("Is valid time: ", isValidTime);

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
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-indigo-600" />
            Schedule New Appointment
          </DialogTitle>
          <DialogDescription>
            Create a new appointment by selecting patient, service, therapist,
            and available time slot.
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
            {/* Patient Selection */}
            <div className="space-y-2">
              <Label htmlFor="patientId" className="flex items-center gap-2">
                <User className="h-4 w-4 text-indigo-600" />
                Patient
              </Label>
              <Select
                onValueChange={(value) => form.setValue("patientId", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select patient" />
                </SelectTrigger>
                <SelectContent>
                  {patients.map((patient: any) => (
                    <SelectItem key={patient.id} value={patient.id}>
                      {patient.patientName} ({patient.id})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.patientId && (
                <p className="text-sm text-red-500">
                  {form.formState.errors.patientId.message}
                </p>
              )}
            </div>

            {/* Service Category Selection */}
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
                  form.setValue("serviceCategory", value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select service category" />
                </SelectTrigger>
                <SelectContent>
                  {serviceCategories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
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

          {/* Service Selection (appears after category is selected) */}
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
                    <SelectItem key={service.id} value={service.id}>
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
            {/* Date Selection */}
            <div className="space-y-2">
              <Label htmlFor="appointmentDate">Appointment Date</Label>
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

            {/* Start Time Selection */}
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

            {/* End Time Selection */}
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

          {/* Appointment Duration Display */}
          {watchedValues.startTime && watchedValues.endTime && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-green-600" />
                <span className="font-medium text-green-800">
                  Appointment Time: {formatTime(watchedValues.startTime)} -{" "}
                  {formatTime(watchedValues.endTime)}(
                  {calculateDuration(
                    watchedValues.startTime,
                    watchedValues.endTime
                  )}{" "}
                  minutes)
                </span>
              </div>
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
                            {!period.available && period.reason && (
                              <span className="text-xs">{period.reason}</span>
                            )}
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
              onClick={form.handleSubmit(onSubmit)}
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
                  Scheduling...
                </div>
              ) : (
                <>
                  <Calendar className="h-4 w-4 mr-2" />
                  Schedule Appointment
                </>
              )}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
