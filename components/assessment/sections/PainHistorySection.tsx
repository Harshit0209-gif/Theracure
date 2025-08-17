import React, { useState } from "react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { AssessmentFormData, PainHistoryData } from "@/types/assessment";
import { Input } from "@/components/ui/input";

interface PainHistorySectionProps {
  formData: AssessmentFormData;
  setFormData: (
    updater: (prev: AssessmentFormData) => AssessmentFormData
  ) => void;
  disabled?: boolean;
}

const PAIN_LOCATIONS = [
  "lower_back",
  "neck",
  "shoulder",
  "knee",
  "hip",
  "ankle",
];
const PAIN_NATURES = ["sharp", "dull", "burning", "throbbing", "shooting"];

export const PainHistorySection: React.FC<PainHistorySectionProps> = ({
  formData,
  setFormData,
  disabled = false,
}) => {
  const [vasScore, setVasScore] = useState([
    formData.painHistory.vasScore || 0,
  ]);

  const updatePainHistory = (
    key: keyof PainHistoryData,
    value: string | number
  ) => {
    setFormData((prev) => ({
      ...prev,
      painHistory: { ...prev.painHistory, [key]: value },
    }));
  };

  const handleVasChange = (value: number) => {
    setVasScore([value]);
    updatePainHistory("vasScore", value);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="text-xs">Pain Location</Label>
          <Select
            value={formData.painHistory.location}
            onValueChange={(value) => updatePainHistory("location", value)}
            disabled={disabled}
          >
            <SelectTrigger className={`h-8 ${disabled ? "bg-gray-100" : ""}`}>
              <SelectValue placeholder="Select location" />
            </SelectTrigger>
            <SelectContent>
              {PAIN_LOCATIONS.map((location) => (
                <SelectItem key={location} value={location}>
                  {location
                    .replace("_", " ")
                    .replace(/\b\w/g, (l) => l.toUpperCase())}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-xs">Pain Nature</Label>
          <Select
            value={formData.painHistory.nature}
            onValueChange={(value) => updatePainHistory("nature", value)}
            disabled={disabled}
          >
            <SelectTrigger className={`h-8 ${disabled ? "bg-gray-100" : ""}`}>
              <SelectValue placeholder="Select nature" />
            </SelectTrigger>
            <SelectContent>
              {PAIN_NATURES.map((nature) => (
                <SelectItem key={nature} value={nature}>
                  {nature.charAt(0).toUpperCase() + nature.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label className="text-xs">VAS Pain Score (0-10)</Label>
        <div className="flex items-center gap-4 mt-2">
          <Input
            type="number"
            placeholder="0-10"
            className={`h-8 ${disabled ? "bg-gray-100" : ""}`}
            value={vasScore[0]}
            onChange={(e) => handleVasChange(Number(e.target.value))}
            disabled={disabled}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="text-xs">Aggravating Factors</Label>
          <Textarea
            placeholder="What makes the pain worse?"
            className={`h-20 text-sm ${disabled ? "bg-gray-100" : ""}`}
            value={formData.painHistory.aggravatingFactors}
            onChange={(e) =>
              updatePainHistory("aggravatingFactors", e.target.value)
            }
            disabled={disabled}
          />
        </div>
        <div>
          <Label className="text-xs">Relieving Factors</Label>
          <Textarea
            placeholder="What relieves the pain?"
            className={`h-20 text-sm ${disabled ? "bg-gray-100" : ""}`}
            value={formData.painHistory.relievingFactors}
            onChange={(e) =>
              updatePainHistory("relievingFactors", e.target.value)
            }
            disabled={disabled}
          />
        </div>
      </div>
    </div>
  );
};
