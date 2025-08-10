import React from "react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AssessmentFormData, MotorExaminationData } from "@/types/assessment";

interface MotorExaminationSectionProps {
  formData: AssessmentFormData;
  setFormData: (
    updater: (prev: AssessmentFormData) => AssessmentFormData
  ) => void;
  disabled?: boolean;
}

interface MotorField {
  key: keyof Pick<
    MotorExaminationData,
    "rom" | "arom" | "prom" | "muscleStrength"
  >;
  label: string;
  placeholder: string;
}

const MOTOR_FIELDS: MotorField[] = [
  {
    key: "rom",
    label: "Range of Motion (ROM)",
    placeholder: "Document ROM findings...",
  },
  {
    key: "arom",
    label: "Active ROM (AROM)",
    placeholder: "Active movements...",
  },
  {
    key: "prom",
    label: "Passive ROM (PROM)",
    placeholder: "Passive movements...",
  },
  {
    key: "muscleStrength",
    label: "Muscle Strength",
    placeholder: "Manual muscle testing...",
  },
];

const MUSCLE_TONES = ["normal", "hypotonic", "hypertonic", "spastic"];

const MMT_GRADES = [
  { value: "0", label: "0 - No contraction" },
  { value: "1", label: "1 - Trace" },
  { value: "2", label: "2 - Poor" },
  { value: "3", label: "3 - Fair" },
  { value: "4", label: "4 - Good" },
  { value: "5", label: "5 - Normal" },
];

export const MotorExaminationSection: React.FC<
  MotorExaminationSectionProps
> = ({ formData, setFormData, disabled = false }) => {
  const updateMotorExam = (key: keyof MotorExaminationData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      motorExamination: { ...prev.motorExamination, [key]: value },
    }));
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        {MOTOR_FIELDS.map((field) => (
          <div key={field.key}>
            <Label className="text-xs">{field.label}</Label>
            <Textarea
              placeholder={field.placeholder}
              className={`h-20 text-sm ${disabled ? "bg-gray-100" : ""}`}
              value={formData.motorExamination[field.key]}
              onChange={(e) => updateMotorExam(field.key, e.target.value)}
              disabled={disabled}
            />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="text-xs">Muscle Tone</Label>
          <Select
            value={formData.motorExamination.tone}
            onValueChange={(value) => updateMotorExam("tone", value)}
            disabled={disabled}
          >
            <SelectTrigger className={`h-8 ${disabled ? "bg-gray-100" : ""}`}>
              {" "}
              <SelectValue placeholder="Select tone" />
            </SelectTrigger>
            <SelectContent>
              {MUSCLE_TONES.map((tone) => (
                <SelectItem key={tone} value={tone}>
                  {tone.charAt(0).toUpperCase() + tone.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-xs">MMT Grade</Label>
          <Select
            value={formData.motorExamination.grade}
            onValueChange={(value) => updateMotorExam("grade", value)}
            disabled={disabled}
          >
            <SelectTrigger className={`h-8 ${disabled ? "bg-gray-100" : ""}`}>
              {" "}
              <SelectValue placeholder="Select grade" />
            </SelectTrigger>
            <SelectContent>
              {MMT_GRADES.map((grade) => (
                <SelectItem key={grade.value} value={grade.value}>
                  {grade.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
};
