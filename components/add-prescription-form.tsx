import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Plus,
  Search,
  User,
  Loader2,
  Printer,
  FileText,
  Activity,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import PrintAssessment from "@/components/print-assessment";
import { useAuth } from "@/contexts/auth-context";
import { calculateSimpleBMI } from "@/lib/utils/bmi-claculator";

interface PatientInfo {
  id: string;
  name: string;
  age: number;
  gender: string;
  height: string;
  weight: string;
  phone?: string;
  email?: string;
  address?: string;
  medicalHistory?: string;
}

interface AssessmentFormData {
  patientId: string;
  height?: number;
  weight?: number;
  chiefComplaints: string;
  historyOfIllness?: string;
  onObservation?: string;
  onPalpation?: string;
  onExaminations?: string;
  differentialDiagnosis?: string;
  investigations?: string;
  specialTests?: string;
  provisionalDiagnosis?: string;
  physiotherapyMgmt?: string;
  notes?: string;
}

export function AddAssessmentDialog({
  onAssessmentAdded,
}: {
  onAssessmentAdded?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchingPatient, setSearchingPatient] = useState(false);
  const [patientId, setPatientId] = useState("");
  const [patientInfo, setPatientInfo] = useState<PatientInfo | null>(null);
  const { user } = useAuth();

  const [formData, setFormData] = useState<AssessmentFormData>({
    patientId: "",
    chiefComplaints: "",
  });

  // Fetch patient details by ID
  const fetchPatientDetails = async (id: string) => {
    if (!id.trim() || id.length < 7) {
      setPatientInfo(null);
      return;
    }

    try {
      setSearchingPatient(true);
      const response = await fetch(`/api/patients/${id}`);

      if (!response.ok) {
        if (response.status === 404) {
          toast({
            title: "Patient Not Found",
            description: "No patient found with this ID",
            variant: "destructive",
          });
        } else {
          throw new Error("Failed to fetch patient");
        }
        setPatientInfo(null);
        return;
      }

      const data = await response.json();
      if (data.success) {
        setPatientInfo(data.patient);
        setFormData((prev) => ({ ...prev, patientId: id }));
        toast({
          title: "Patient Found",
          description: `Patient: ${data.patient.name}`,
        });
      }
    } catch (error) {
      console.error("Error fetching patient:", error);
      toast({
        title: "Error",
        description: "Failed to fetch patient details",
        variant: "destructive",
      });
      setPatientInfo(null);
    } finally {
      setSearchingPatient(false);
    }
  };

  // Handle patient ID change with debounce
  const handlePatientIdChange = (value: string) => {
    setPatientId(value);

    // Clear previous patient info if ID is cleared
    if (!value.trim()) {
      setPatientInfo(null);
      setFormData((prev) => ({ ...prev, patientId: "" }));
      return;
    }

    // Debounce the API call
    const timeoutId = setTimeout(() => {
      fetchPatientDetails(value);
    }, 500);

    return () => clearTimeout(timeoutId);
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    if (!user) {
      toast({
        title: "Authentication Error",
        description: "You must be logged in to create an assessment",
        variant: "destructive",
      });
      return;
    }
    e.preventDefault();
    console.log("Form submitted with data:", formData);
    console.log("Patient Info:", patientInfo);

    if (!patientInfo) {
      toast({
        title: "Validation Error",
        description: "Please enter a valid patient ID",
        variant: "destructive",
      });
      return;
    }

    if (!formData.chiefComplaints.trim()) {
      toast({
        title: "Validation Error",
        description: "Chief complaints is required",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);

      const payloadData = {
        assessmentData: formData,
        patientId: patientInfo.id,
        therapistId: user.id,
      };

      const response = await fetch("/api/prescriptions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payloadData),
      });

      if (!response.ok) {
        throw new Error("Failed to create assessment");
      }

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Success",
          description: "Assessment created successfully",
        });

        // Reset form
        resetForm();
        setOpen(false);

        // Callback to refresh parent component
        onAssessmentAdded?.();
      } else {
        throw new Error(data.error || "Failed to create assessment");
      }
    } catch (error) {
      console.error("Error creating assessment:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to create assessment",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Reset form
  const resetForm = () => {
    setPatientId("");
    setPatientInfo(null);
    setFormData({
      patientId: "",
      chiefComplaints: "",
    });
  };

  // Handle dialog close
  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      resetForm();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button className="bg-indigo-600 hover:bg-indigo-700 text-white">
          <Plus className="h-4 w-4 mr-2" />
          Add Assessment
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            Create New Patient Assessment
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Patient Search Section */}
          <div className="bg-gray-50 p-4 rounded-lg border">
            <h3 className="font-medium text-gray-900 mb-3">
              Patient Information
            </h3>

            <div className="space-y-3">
              <div className="flex gap-3">
                <div className="flex-1">
                  <Label htmlFor="patientId">Patient ID *</Label>
                  <div className="relative mt-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      id="patientId"
                      value={patientId}
                      onChange={(e) => handlePatientIdChange(e.target.value)}
                      placeholder="Enter Patient ID (e.g., THRC000001)"
                      className="pl-10"
                      disabled={loading}
                    />
                    {searchingPatient && (
                      <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin text-gray-400" />
                    )}
                  </div>
                </div>
              </div>

              {/* Patient Details Display */}
              {patientInfo && (
                <div className="bg-white border border-green-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <User className="h-4 w-4 text-green-600" />
                    <span className="font-medium text-green-800">
                      Patient Found
                    </span>
                  </div>

                  {/* Basic Info Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm mb-4">
                    <div>
                      <span className="font-medium text-gray-600">Name:</span>
                      <p className="text-gray-900">{patientInfo.name}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">ID:</span>
                      <p className="text-gray-900">{patientInfo.id}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Age:</span>
                      <p className="text-gray-900">{patientInfo.age} years</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Gender:</span>
                      <p className="text-gray-900 capitalize">
                        {patientInfo.gender}
                      </p>
                    </div>
                  </div>

                  {/* Physical Measurements & BMI */}
                  <div className="bg-gray-50 rounded-lg p-3 mb-4">
                    <h4 className="font-medium text-gray-700 mb-2 flex items-center gap-2">
                      <Activity className="h-4 w-4" />
                      Physical Measurements
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-600">
                          Height:
                        </span>
                        <p className="text-gray-900">
                          {patientInfo.height
                            ? `${patientInfo.height} cm`
                            : "Not recorded"}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-600">
                          Weight:
                        </span>
                        <p className="text-gray-900">
                          {patientInfo.weight
                            ? `${patientInfo.weight} kg`
                            : "Not recorded"}
                        </p>
                      </div>

                      {/* BMI Calculation */}
                      {patientInfo.height && patientInfo.weight && (
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-600">
                            BMI:
                          </span>
                          <div className="flex items-center gap-2">
                            {(() => {
                              const bmiData = calculateSimpleBMI(
                                parseInt(patientInfo.weight),
                                parseInt(patientInfo.height)
                              );
                              return (
                                <>
                                  <span className="text-gray-900 font-medium">
                                    {bmiData.bmi}
                                  </span>
                                  <span
                                    className="px-2 py-1 rounded-full text-xs font-medium"
                                    style={{
                                      backgroundColor: bmiData.color + "20",
                                      color: bmiData.color,
                                      border: `1px solid ${bmiData.color}40`,
                                    }}
                                  >
                                    {bmiData.status}
                                  </span>
                                </>
                              );
                            })()}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Medical History */}
                  {patientInfo.medicalHistory && (
                    <div className="mt-4 pt-3 border-t border-gray-200">
                      <div className="flex items-center gap-2 mb-2">
                        <FileText className="h-4 w-4 text-gray-600" />
                        <span className="font-medium text-gray-600">
                          Medical History:
                        </span>
                      </div>
                      <div className="p-3 bg-gray-50 rounded-md border">
                        <p className="text-gray-900 text-sm whitespace-pre-wrap">
                          {patientInfo.medicalHistory}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Assessment Fields */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="chiefComplaints">Chief Complaints *</Label>
              <Textarea
                id="chiefComplaints"
                value={formData.chiefComplaints}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    chiefComplaints: e.target.value,
                  }))
                }
                placeholder="Patient's main complaints and symptoms..."
                rows={3}
                required
              />
            </div>

            <div>
              <Label htmlFor="historyOfIllness">
                History of Present Illness (H/O)
              </Label>
              <Textarea
                id="historyOfIllness"
                value={formData.historyOfIllness || ""}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    historyOfIllness: e.target.value,
                  }))
                }
                placeholder="Detailed history of the current condition..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="onObservation">On Observation</Label>
                <Textarea
                  id="onObservation"
                  value={formData.onObservation || ""}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      onObservation: e.target.value,
                    }))
                  }
                  placeholder="Visual observations..."
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="onPalpation">On Palpation</Label>
                <Textarea
                  id="onPalpation"
                  value={formData.onPalpation || ""}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      onPalpation: e.target.value,
                    }))
                  }
                  placeholder="Palpation findings..."
                  rows={3}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="onExaminations">On Examinations</Label>
              <Textarea
                id="onExaminations"
                value={formData.onExaminations || ""}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    onExaminations: e.target.value,
                  }))
                }
                placeholder="Examination findings..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="differentialDiagnosis">
                  Differential Diagnosis
                </Label>
                <Textarea
                  id="differentialDiagnosis"
                  value={formData.differentialDiagnosis || ""}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      differentialDiagnosis: e.target.value,
                    }))
                  }
                  placeholder="Possible diagnoses..."
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="investigations">Investigations</Label>
                <Textarea
                  id="investigations"
                  value={formData.investigations || ""}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      investigations: e.target.value,
                    }))
                  }
                  placeholder="Required investigations..."
                  rows={3}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="specialTests">Special Tests</Label>
              <Textarea
                id="specialTests"
                value={formData.specialTests || ""}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    specialTests: e.target.value,
                  }))
                }
                placeholder="Special tests performed..."
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="provisionalDiagnosis">
                Provisional Diagnosis
              </Label>
              <Textarea
                id="provisionalDiagnosis"
                value={formData.provisionalDiagnosis || ""}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    provisionalDiagnosis: e.target.value,
                  }))
                }
                placeholder="Provisional diagnosis..."
                rows={2}
              />
            </div>

            <div>
              <Label htmlFor="physiotherapyMgmt">
                Physiotherapy Management
              </Label>
              <Textarea
                id="physiotherapyMgmt"
                value={formData.physiotherapyMgmt || ""}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    physiotherapyMgmt: e.target.value,
                  }))
                }
                placeholder="Treatment plan and management..."
                rows={4}
              />
            </div>

            <div>
              <Label htmlFor="notes">Additional Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes || ""}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, notes: e.target.value }))
                }
                placeholder="Any additional notes..."
                rows={2}
              />
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            {patientInfo && (
              <PrintAssessment
                assessmentData={formData}
                patientInfo={patientInfo}
                therapistId={user?.id}
              />
            )}
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || !patientInfo}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Assessment
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
