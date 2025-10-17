import React, { useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { calculateSimpleBMI } from "@/lib/utils/bmi-claculator";
import { AssessmentFormData, VitalsData } from "@/types/assessment";
import { Patient as PatientInfo } from "@/types/patient";

interface VitalsSectionProps {
  formData: AssessmentFormData;
  setFormData: (
    updater: (prev: AssessmentFormData) => AssessmentFormData
  ) => void;
  patientInfo?: PatientInfo | null;
  disabled?: boolean;
}

interface VitalField {
  key: keyof Omit<VitalsData, "bloodPressure">;
  label: string;
  unit: string;
  fromProfile?: boolean;
  disabled?: boolean;
}

export const VitalsSection: React.FC<VitalsSectionProps> = ({
  formData,
  setFormData,
  patientInfo,
  disabled = false,
}) => {
  // Auto-calculate BMI
  useEffect(() => {
    const { height, weight } = formData.vitals;
    if (height && weight) {
      const bmi = calculateSimpleBMI(weight, height);
      setFormData((prev) => ({
        ...prev,
        vitals: { ...prev.vitals, bmi: bmi.bmi },
      }));
    }
  }, [formData.vitals.height, formData.vitals.weight, setFormData]);

  const updateVital = (key: keyof VitalsData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      vitals: { ...prev.vitals, [key]: value },
    }));
  };

  const updateBloodPressure = (
    type: "systolic" | "diastolic",
    value: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      vitals: {
        ...prev.vitals,
        bloodPressure: { ...prev.vitals.bloodPressure, [type]: value },
      },
    }));
  };

  const vitalFields: VitalField[] = [
    {
      key: "pulse",
      label: "Pulse Rate",
      unit: "beats/min",
      fromProfile: false,
    },
    { key: "weight", label: "Weight", unit: "kg", fromProfile: true },
    { key: "height", label: "Height", unit: "cm", fromProfile: true },
    {
      key: "bmi",
      label: "BMI",
      unit: "kg/cm²",
      disabled: true,
      fromProfile: false,
    },
    {
      key: "temperature",
      label: "Temperature",
      unit: "°F",
      fromProfile: false,
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div>
        <Label className="text-xs">Blood Pressure</Label>
        <div className="flex items-center gap-2">
          <Input
            placeholder="120"
            className="w-16 h-8"
            value={formData.vitals.bloodPressure.systolic}
            onChange={(e) => updateBloodPressure("systolic", e.target.value)}
            disabled={disabled}
          />
          <span className="text-sm">/</span>
          <Input
            placeholder="80"
            className="w-16 h-8"
            value={formData.vitals.bloodPressure.diastolic}
            onChange={(e) => updateBloodPressure("diastolic", e.target.value)}
            disabled={disabled}
          />
          <span className="text-xs text-gray-500">mmHg</span>
        </div>
      </div>

      {vitalFields.map((field) => {
        const fieldValue = formData.vitals[field.key] as string;
        const profileValue =
          field.fromProfile && patientInfo
            ? (patientInfo[field.key as keyof PatientInfo] as string)
            : "";

        return (
          <div key={field.key}>
            <Label className="text-xs">
              {field.label}
              {field.fromProfile && patientInfo && profileValue && (
                <Badge
                  variant="outline"
                  className="ml-1 text-xs text-green-600"
                >
                  from profile
                </Badge>
              )}
            </Label>
            <Input
              placeholder={
                field.fromProfile && profileValue
                  ? profileValue
                  : field.key === "bmi"
                  ? "22.5"
                  : ""
              }
              className={`h-8 ${disabled ? "bg-gray-100" : ""}`}
              value={fieldValue || ""}
              onChange={(e) => updateVital(field.key, e.target.value)}
              disabled={field.disabled || disabled}
            />
            <span className="text-xs text-gray-500">{field.unit}</span>
          </div>
        );
      })}
    </div>
  );
};
