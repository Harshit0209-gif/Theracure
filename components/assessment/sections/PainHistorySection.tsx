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
import { AssessmentFormData, PainHistoryData, VasScoreEntry } from "@/types/assessment";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2 } from "lucide-react";

interface PainHistorySectionProps {
  formData: AssessmentFormData;
  setFormData: (
    updater: (prev: AssessmentFormData) => AssessmentFormData
  ) => void;
  disabled?: boolean;
}
const PAIN_NATURES = ["sharp", "dull", "burning", "throbbing", "shooting"];
const TIME_OF_DAY = ["Morning", "Afternoon", "Evening", "Night", "All Day"];

export const PainHistorySection: React.FC<PainHistorySectionProps> = ({
  formData,
  setFormData,
  disabled = false,
}) => {
  const updatePainHistory = (
    key: keyof PainHistoryData,
    value: string | number | VasScoreEntry[]
  ) => {
    setFormData((prev) => ({
      ...prev,
      painHistory: { ...prev.painHistory, [key]: value },
    }));
  };

  const addVasScore = () => {
    const newVasScore: VasScoreEntry = {
      id: `vas-${Date.now()}`,
      location: "",
      activity: "",
      vasScore: 0,
      timeOfDay: "",
      notes: "",
    };

    updatePainHistory("vasScores", [
      ...formData.painHistory.vasScores,
      newVasScore,
    ]);
  };

  const removeVasScore = (id: string) => {
    updatePainHistory(
      "vasScores",
      formData.painHistory.vasScores.filter((score) => score.id !== id)
    );
  };

  const updateVasScore = (id: string, field: keyof VasScoreEntry, value: string | number) => {
    updatePainHistory(
      "vasScores",
      formData.painHistory.vasScores.map((score) =>
        score.id === id ? { ...score, [field]: value } : score
      )
    );
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label className="text-xs">Pain Location</Label>
          <Input
            type="text"
            value={formData.painHistory.location}
            onChange={(e) => updatePainHistory("location", e.target.value)}
            placeholder="Enter Pain location"
            className={`h-8 text-sm ${disabled ? "bg-gray-100" : ""}`}
            disabled={disabled}
          />
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

      {/* Multiple VAS Scores Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-semibold">VAS Pain Scores</Label>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={addVasScore}
            disabled={disabled}
            className="h-8"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add VAS Score
          </Button>
        </div>

        {formData.painHistory.vasScores.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
            <p className="text-sm text-gray-500">
              No VAS scores added yet. Click &quot;Add VAS Score&quot; to add one.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {formData.painHistory.vasScores.map((vasEntry, index) => (
              <Card key={vasEntry.id} className="border-l-4 border-l-indigo-500">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium">
                      VAS Score #{index + 1}
                    </CardTitle>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => removeVasScore(vasEntry.id)}
                      disabled={disabled}
                      className="h-7 w-7 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-start">
                    <div>
                      <Label className="text-xs">Location</Label>
                      <Input
                        type="text"
                        value={vasEntry.location}
                        onChange={(e) =>
                          updateVasScore(vasEntry.id, "location", e.target.value)
                        }
                        placeholder="e.g., Lower back, Right knee"
                        className={`h-8 text-sm ${disabled ? "bg-gray-100" : ""}`}
                        disabled={disabled}
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Activity/Position</Label>
                      <Input
                        type="text"
                        value={vasEntry.activity}
                        onChange={(e) =>
                          updateVasScore(vasEntry.id, "activity", e.target.value)
                        }
                        placeholder="e.g., Walking, Sitting, At rest"
                        className={`h-8 text-sm ${disabled ? "bg-gray-100" : ""}`}
                        disabled={disabled}
                      />
                    </div>
                  </div>

                  <div>
                    <Label className="text-xs">Pain Score (0-10)</Label>
                    <div className="flex items-center gap-4 mt-2">
                      <Slider
                        value={[vasEntry.vasScore]}
                        onValueChange={(value) =>
                          updateVasScore(vasEntry.id, "vasScore", value[0])
                        }
                        max={10}
                        step={0.1}
                        className={`flex-1 ${
                          disabled ? "opacity-50 cursor-not-allowed" : ""
                        }`}
                        disabled={disabled}
                      />
                      <Badge
                        variant="outline"
                        className={`min-w-[60px] justify-center ${
                          disabled ? "bg-gray-100 text-gray-500 border-gray-300" : ""
                        }`}
                      >
                        {vasEntry.vasScore.toFixed(1)}/10
                      </Badge>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>No Pain</span>
                      <span>Worst Pain</span>
                    </div>
                  </div>

                  <div>
                    <Label className="text-xs">Time of Day</Label>
                    <Select
                      value={vasEntry.timeOfDay}
                      onValueChange={(value) =>
                        updateVasScore(vasEntry.id, "timeOfDay", value)
                      }
                      disabled={disabled}
                    >
                      <SelectTrigger className={`h-8 ${disabled ? "bg-gray-100" : ""}`}>
                        <SelectValue placeholder="Select time" />
                      </SelectTrigger>
                      <SelectContent>
                        {TIME_OF_DAY.map((time) => (
                          <SelectItem key={time} value={time}>
                            {time}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-xs">Notes</Label>
                    <Textarea
                      placeholder="Additional details about this pain measurement..."
                      className={`h-16 text-sm ${disabled ? "bg-gray-100" : ""}`}
                      value={vasEntry.notes}
                      onChange={(e) =>
                        updateVasScore(vasEntry.id, "notes", e.target.value)
                      }
                      disabled={disabled}
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
