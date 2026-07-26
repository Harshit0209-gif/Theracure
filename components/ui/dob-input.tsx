"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "lucide-react";
import { DatePickerDialog } from "@/components/ui/date-picker-dialog";
import {
  formatIsoToDisplay,
  maskDateInput,
  parseDobInput,
} from "@/lib/utils/dob-input-mask";

interface DobInputProps {
  /** Selected date of birth, ISO format (YYYY-MM-DD), or "" when unset */
  value: string;
  /** Called with an ISO date string once a valid date is entered/selected, or "" while incomplete/invalid */
  onChange: (isoDate: string) => void;
  label?: string;
  id?: string;
  disabled?: boolean;
  /** Threshold for interpreting a 2-digit year: values below this go to 2000s, otherwise 1900s. Default: 30 */
  pivotYear?: number;
}

export function DobInput({
  value,
  onChange,
  label = "Date of Birth",
  id = "dateOfBirth",
  disabled,
  pivotYear,
}: DobInputProps) {
  const [displayText, setDisplayText] = useState(() => formatIsoToDisplay(value));
  const [error, setError] = useState<string | null>(null);
  const [calendarOpen, setCalendarOpen] = useState(false);

  // Keep the typed display in sync when the value changes from outside
  // (e.g. the calendar dialog picked a date, or the form was reset).
  useEffect(() => {
    setDisplayText(formatIsoToDisplay(value));
    setError(null);
  }, [value]);

  const tryCommit = (text: string, showErrorOnFailure: boolean) => {
    const digitCount = text.replace(/\D/g, "").length;
    if (digitCount !== 6 && digitCount !== 8) {
      if (text.trim() === "") {
        setError(null);
        onChange("");
      } else if (showErrorOnFailure) {
        setError("Date of birth must be in DD/MM/YYYY format");
        onChange("");
      }
      return;
    }

    const result = parseDobInput(text, pivotYear);
    if (result.valid) {
      setError(null);
      setDisplayText(formatIsoToDisplay(result.isoDate));
      onChange(result.isoDate);
    } else if (showErrorOnFailure) {
      setError(result.error);
      onChange("");
    }
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const masked = maskDateInput(e.target.value);
    setDisplayText(masked);

    const digitCount = masked.replace(/\D/g, "").length;
    if (digitCount === 0) {
      // Cleared — reset immediately so the age preview clears too.
      setError(null);
      onChange("");
    } else if (digitCount === 8) {
      // Unambiguous full DD/MM/YYYY — commit live so the age preview
      // updates without waiting for blur. A 6-digit DD/MM/YY entry is
      // deliberately NOT committed here: the user may still be typing
      // two more digits to complete a 4-digit year, and eagerly
      // expanding/reformatting mid-keystroke would rewrite the field
      // out from under them. That case resolves on blur/Enter instead.
      tryCommit(masked, false);
    }
  };

  const handleBlur = () => {
    tryCommit(displayText, true);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      tryCommit(displayText, true);
    }
  };

  const errorId = `${id}-error`;

  return (
    <div className="space-y-2">
      {label && <Label htmlFor={id}>{label}</Label>}
      <div className="relative">
        <Input
          id={id}
          type="text"
          inputMode="numeric"
          pattern="[0-9/]*"
          maxLength={10}
          placeholder="DD/MM/YYYY"
          value={displayText}
          onChange={handleTextChange}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          className="pr-10"
        />
        <button
          type="button"
          onClick={() => setCalendarOpen(true)}
          disabled={disabled}
          aria-label="Open calendar"
          className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600 transition-colors disabled:opacity-50"
        >
          <Calendar className="h-4 w-4" />
        </button>
      </div>
      {error && (
        <p id={errorId} className="text-xs text-red-500">
          {error}
        </p>
      )}

      <DatePickerDialog
        open={calendarOpen}
        onOpenChange={setCalendarOpen}
        value={value}
        onChange={(isoDate) => {
          setError(null);
          setDisplayText(formatIsoToDisplay(isoDate));
          onChange(isoDate);
        }}
        title="Select Date of Birth"
        disablePast={false}
        disableFuture={true}
        enableYearPicker
      />
    </div>
  );
}
