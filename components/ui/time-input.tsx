"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Clock } from "lucide-react";

interface TimeInputProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  min?: string;
}

export function TimeInput({
  id,
  label,
  value,
  onChange,
  disabled = false,
  min,
}: TimeInputProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-sm font-bold text-slate-700 flex items-center gap-2">
        <Clock className="h-4 w-4 text-indigo-500" />
        {label}
      </Label>
      <Input
        id={id}
        type="time"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        min={min}
        className="bg-white border-indigo-300 h-10 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
      />
    </div>
  );
}
