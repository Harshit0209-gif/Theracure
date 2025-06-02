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
import { Plus, Search, User, Loader2, Printer } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import PrintAssessment from "@/components/print-assessment";

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

const assessmentData = {
  patient: {
    patientName: "John Doe",
    id: "001",
    age: "35",
    gender: "Male",
  },
  assessmentDate: "2024-01-26",
  height: "175",
  weight: "70",
  chiefComplaints: "Lower back pain radiating to left leg for 2 weeks",
  historyOfIllness:
    "Patient reports gradual onset of lower back pain following heavy lifting at work. Pain is worse in the morning and improves with movement.",
  onObservation:
    "Patient appears uncomfortable, antalgic gait noted, forward head posture observed",
  onPalpation:
    "Tenderness over L4-L5 region, muscle spasm in lumbar paraspinals",
  onExaminations:
    "Reduced lumbar flexion (30°), positive straight leg raise test at 45° on left side",
  differentialDiagnosis:
    "1. Lumbar disc herniation 2. Lumbar radiculopathy 3. Muscle strain",
  investigations: "MRI lumbar spine recommended to rule out disc herniation",
  specialTests:
    "Straight leg raise test: Positive at 45° (left), Negative (right). Lasegue test: Positive",
  provisionalDiagnosis: "L4-L5 disc herniation with left sided radiculopathy",
  physiotherapyMgmt:
    "1. Pain management with TENS and heat therapy 2. Gentle lumbar mobilization 3. Core strengthening exercises 4. Postural correction 5. Patient education",
};

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

  const [formData, setFormData] = useState<AssessmentFormData>({
    patientId: "",
    chiefComplaints: "",
  });

  // Fetch patient details by ID
  const fetchPatientDetails = async (id: string) => {
    if (!id.trim()) {
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
          description: `Patient: ${data.patient.patientName}`,
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
    e.preventDefault();

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

      const assessmentData = {
        ...formData,
        patientId: patientInfo.id,
      };

      const response = await fetch("/api/prescriptions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(assessmentData),
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
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                    <div>
                      <span className="font-medium text-gray-600">Name:</span>
                      <p className="text-gray-900">{patientInfo.name}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">ID:</span>
                      {patientInfo.id}
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
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-600">Height:</span>
                      <p className="text-gray-900">
                        {patientInfo.height
                          ? `${patientInfo.height} cm`
                          : "Not recorded"}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-600">Weight:</span>
                      <p className="text-gray-900">
                        {patientInfo.weight
                          ? `${patientInfo.weight} kg`
                          : "Not recorded"}
                      </p>
                    </div>
                  </div>
                  {patientInfo.medicalHistory && (
                    <div className="mt-4 pt-3 border-t border-gray-200">
                      <span className="font-medium text-gray-600">
                        Medical History:
                      </span>
                      <div className="mt-1 p-2 bg-gray-50 rounded-md border">
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
            <PrintAssessment
              assessmentData={assessmentData}
              patientInfo={assessmentData.patient}
              showPreview={false}
            />
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
