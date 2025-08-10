import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AssessmentFormData, OnObservationData } from "@/types/assessment";

interface ObservationSectionProps {
  formData: AssessmentFormData;
  setFormData: (
    updater: (prev: AssessmentFormData) => AssessmentFormData
  ) => void;
  disabled?: boolean;
}

interface ObservationField {
  key: keyof OnObservationData;
  label: string;
  type: "select" | "input";
  placeholder?: string;
  options?: { value: string; label: string }[];
}

const OBSERVATION_FIELDS: ObservationField[] = [
  {
    key: "bodyBuild",
    label: "Body Build",
    type: "select",
    options: [
      { value: "ectomorph", label: "Ectomorph" },
      { value: "mesomorph", label: "Mesomorph" },
      { value: "endomorph", label: "Endomorph" },
    ],
  },
  {
    key: "posture",
    label: "Posture",
    type: "input",
    placeholder: "e.g., Forward head posture",
  },
  {
    key: "gait",
    label: "Gait",
    type: "select",
    options: [
      { value: "normal", label: "Normal" },
      { value: "antalgic", label: "Antalgic" },
      { value: "trendelenburg", label: "Trendelenburg" },
      { value: "limping", label: "Limping" },
    ],
  },
  {
    key: "weightBearing",
    label: "Weight Bearing",
    type: "select",
    options: [
      { value: "equal_bilateral", label: "Equal Bilateral" },
      { value: "left_favoring", label: "Left Favoring" },
      { value: "right_favoring", label: "Right Favoring" },
      { value: "non_weight_bearing", label: "Non Weight Bearing" },
    ],
  },
];

export const ObservationSection: React.FC<ObservationSectionProps> = ({
  formData,
  setFormData,
  disabled = false,
}) => {
  const updateObservation = (key: keyof OnObservationData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      onObservation: { ...prev.onObservation, [key]: value },
    }));
  };

  return (
    <div className="grid grid-cols-2 gap-4">
      {OBSERVATION_FIELDS.map((field) => (
        <div key={field.key}>
          <Label className="text-xs">{field.label}</Label>
          {field.type === "select" ? (
            <Select
              value={formData.onObservation[field.key]}
              onValueChange={(value) => updateObservation(field.key, value)}
              disabled={disabled}
            >
              <SelectTrigger className="h-8">
                <SelectValue
                  placeholder={`Select ${field.label.toLowerCase()}`}
                />
              </SelectTrigger>
              <SelectContent>
                {field.options?.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <Input
              placeholder={field.placeholder}
              className="h-8 text-sm"
              value={formData.onObservation[field.key]}
              onChange={(e) => updateObservation(field.key, e.target.value)}
              disabled={disabled}
            />
          )}
        </div>
      ))}
    </div>
  );
};
