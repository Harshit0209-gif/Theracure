import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useEffect, useState } from "react";
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
import { Patient } from "@/types/patient";
import { Save, X } from "lucide-react";
import { DobInput } from "@/components/ui/dob-input";
import { calculateAge } from "@/lib/utils/age-calculator";

// Edit Patient Dialog Component
export const EditPatientDialog = ({
  patient,
  open,
  onOpenChange,
  onSave,
}: {
  patient: Patient | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (updatedPatient: Patient) => void;
}) => {
  const [formData, setFormData] = useState<Partial<Patient>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (patient) {
      setFormData({ ...patient });
    }
  }, [patient]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patient) return;

    console.log("Update form data: ", JSON.stringify(formData));

    setLoading(true);
    try {
      const response = await fetch(`/api/patients/${patient.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();

        let description = "Failed to update patient. Please try again.";

        if (errorData.details) {
          const fieldErrors = Object.values(errorData.details)
            .map((err: any) => err._errors?.join(", "))
            .filter(Boolean)
            .join("; ");
          description = fieldErrors || description;
        } else if (errorData.error) {
          description = errorData.error;
        }

        throw new Error(description);
      }

      const updatedPatient = await response.json();
      onSave(updatedPatient);
      onOpenChange(false);
      toast({
        title: "Success",
        description: "Patient updated successfully.",
      });
    } catch (error) {
      console.error("Error updating patient:", error);

      let message = "Failed to update patient. Please try again.";
      if (error instanceof Error) {
        message = error.message;
      }

      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof Patient, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  if (!patient) return null;

  const computedAge = calculateAge(formData.dateOfBirth);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Patient Information</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="patientName">Patient Name</Label>
                <Input
                  id="patientName"
                  value={formData.patientName || ""}
                  onChange={(e) =>
                    handleInputChange("patientName", e.target.value)
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <DobInput
                  id="dateOfBirth"
                  label="Date of Birth"
                  value={formData.dateOfBirth || ""}
                  onChange={(date) => handleInputChange("dateOfBirth", date)}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-gray-500">
                  Calculated Age
                </Label>
                <Input
                  readOnly
                  disabled
                  value={
                    computedAge?.formatted ??
                    (patient.age ? `${patient.age} years (on file)` : "")
                  }
                  className="w-full bg-gray-100"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="gender">Gender</Label>
                <Select
                  value={formData.gender || ""}
                  onValueChange={(value) => handleInputChange("gender", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Male">Male</SelectItem>
                    <SelectItem value="Female">Female</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Physical Measurements */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Physical Measurements</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="height">Height (cm)</Label>
                <Input
                  id="height"
                  type="number"
                  value={formData.height || ""}
                  onChange={(e) =>
                    handleInputChange("height", parseFloat(e.target.value))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="weight">Weight (kg)</Label>
                <Input
                  id="weight"
                  type="number"
                  step="0.1"
                  value={formData.weight || ""}
                  onChange={(e) =>
                    handleInputChange("weight", parseFloat(e.target.value))
                  }
                />
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Contact Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={formData.phone || ""}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email || ""}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={formData.address || ""}
                onChange={(e) => handleInputChange("address", e.target.value)}
              />
            </div>
          </div>

          {/* Medical Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Medical Information</h3>
            <div className="space-y-2">
              <Label htmlFor="medicalHistory">Medical History</Label>
              <Textarea
                id="medicalHistory"
                value={formData.medicalHistory || ""}
                onChange={(e) =>
                  handleInputChange("medicalHistory", e.target.value)
                }
                rows={4}
              />
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-2 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
