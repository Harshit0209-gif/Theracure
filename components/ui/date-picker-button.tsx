"use client";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { DatePickerDialog } from "@/components/ui/date-picker-dialog";
import { Calendar } from "lucide-react";
import { useState } from "react";

interface DatePickerButtonProps {
  label?: string;
  value: string;
  onChange: (date: string) => void;
  title?: string;
  disablePast?: boolean;
  contentClassName?: string;
}

export function DatePickerButton({
  label = "Booking Date",
  value,
  onChange,
  title = "Select Date",
  disablePast = true,
  contentClassName,
}: DatePickerButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="space-y-2">
        {label && (
          <Label className="text-sm font-bold text-slate-700">{label}</Label>
        )}
        <Button
          type="button"
          variant="outline"
          onClick={() => setOpen(true)}
          className="w-full flex justify-between items-center bg-slate-50 border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/50 h-11 px-4 transition-all shadow-sm"
        >
          <span className={value ? "text-slate-900 font-bold" : "text-slate-400 font-medium"}>
            {value
              ? new Date(value).toLocaleDateString("en-IN", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })
              : "Select date..."}
          </span>
          <Calendar className="h-4 w-4 text-indigo-500 opacity-70" />
        </Button>
      </div>

      <DatePickerDialog
        open={open}
        onOpenChange={setOpen}
        value={value}
        onChange={onChange}
        title={title}
        disablePast={disablePast}
        contentClassName={contentClassName}
      />
    </>
  );
}
