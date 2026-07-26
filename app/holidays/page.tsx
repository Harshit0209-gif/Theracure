"use client";

import { useState, useEffect } from "react";
import {
  Plus,
  Edit,
  Trash2,
  CalendarOff,
  MoreVertical,
  X,
  Search,
  Repeat,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { DatePickerButton } from "@/components/ui/date-picker-button";
import { toast } from "@/components/ui/use-toast";
import { Holiday, DAY_NAMES, WeeklyOffDay } from "@/types/holiday";

interface HolidayFormData {
  name: string;
  date: string;
  description: string;
  isRecurring: boolean;
  isActive: boolean;
}

const EMPTY_FORM: HolidayFormData = {
  name: "",
  date: "",
  description: "",
  isRecurring: false,
  isActive: true,
};

function HolidayForm({
  data,
  onChange,
  onSubmit,
  onCancel,
  loading,
  mode,
}: {
  data: HolidayFormData;
  onChange: (data: HolidayFormData) => void;
  onSubmit: () => void;
  onCancel: () => void;
  loading: boolean;
  mode: "add" | "edit";
}) {
  return (
    <>
      <div className="grid gap-4 py-4">
        <div className="grid gap-1.5">
          <Label htmlFor="holiday-name">Holiday Name</Label>
          <Input
            id="holiday-name"
            placeholder="e.g., Independence Day"
            value={data.name}
            onChange={(e) => onChange({ ...data, name: e.target.value })}
            className="border-gray-200 focus:border-indigo-400 rounded-lg shadow-sm"
          />
        </div>
        <div className="grid gap-1.5">
          <DatePickerButton
            label="Holiday Date"
            value={data.date}
            onChange={(date) => onChange({ ...data, date })}
            title="Select Holiday Date"
            disablePast={false}
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="holiday-desc">Description</Label>
          <Textarea
            id="holiday-desc"
            placeholder="Additional details about this holiday..."
            rows={2}
            value={data.description}
            onChange={(e) => onChange({ ...data, description: e.target.value })}
            className="border-gray-200 rounded-lg shadow-sm resize-none"
          />
        </div>
        <div className="flex items-center gap-2">
          <Checkbox
            id="holiday-recurring"
            checked={data.isRecurring}
            onCheckedChange={(checked) =>
              onChange({ ...data, isRecurring: checked as boolean })
            }
          />
          <Label htmlFor="holiday-recurring" className="text-sm font-normal cursor-pointer">
            Recurs every year on this date
          </Label>
        </div>
        <div className="flex items-center gap-2">
          <Checkbox
            id="holiday-active"
            checked={data.isActive}
            onCheckedChange={(checked) =>
              onChange({ ...data, isActive: checked as boolean })
            }
          />
          <Label htmlFor="holiday-active" className="text-sm font-normal cursor-pointer">
            Active (blocks bookings on this date)
          </Label>
        </div>
      </div>
      <DialogFooter className="gap-2">
        <Button variant="outline" onClick={onCancel} className="rounded-lg">
          Cancel
        </Button>
        <Button
          onClick={onSubmit}
          disabled={loading || !data.name || !data.date}
          className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-sm"
        >
          {loading ? "Saving..." : mode === "add" ? "Add Holiday" : "Save Changes"}
        </Button>
      </DialogFooter>
    </>
  );
}

function WeeklyOffCard({
  days,
  onSave,
  saving,
}: {
  days: WeeklyOffDay[];
  onSave: (activeDays: number[]) => void;
  saving: boolean;
}) {
  const [selected, setSelected] = useState<Set<number>>(new Set());

  useEffect(() => {
    setSelected(new Set(days.filter((d) => d.isActive).map((d) => d.weekDay)));
  }, [days]);

  const toggle = (weekDay: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(weekDay)) next.delete(weekDay);
      else next.add(weekDay);
      return next;
    });
  };

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 mb-6">
      <h3 className="text-sm font-bold text-gray-800 mb-1">Weekly Off Days</h3>
      <p className="text-xs text-gray-500 mb-4">
        Select which days of the week the clinic is closed. These behave exactly like holidays.
      </p>
      <div className="flex flex-wrap gap-3 mb-4">
        {DAY_NAMES.map((label, weekDay) => (
          <label
            key={weekDay}
            className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 cursor-pointer hover:border-indigo-300"
          >
            <Checkbox
              checked={selected.has(weekDay)}
              onCheckedChange={() => toggle(weekDay)}
            />
            <span className="text-sm text-gray-700">{label}</span>
          </label>
        ))}
      </div>
      <Button
        onClick={() => onSave(Array.from(selected))}
        disabled={saving}
        className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-sm"
      >
        {saving ? "Saving..." : "Save Weekly Off"}
      </Button>
    </div>
  );
}

function HolidayCard({
  holiday,
  onEdit,
  onDelete,
  onToggleActive,
}: {
  holiday: Holiday;
  onEdit: (holiday: Holiday) => void;
  onDelete: (id: string) => void;
  onToggleActive: (holiday: Holiday) => void;
}) {
  return (
    <div
      className={`group bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden ${!holiday.isActive ? "opacity-60" : ""}`}
    >
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="p-2 rounded-lg bg-red-100 text-red-600">
            <CalendarOff className="h-4 w-4" />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-gray-400 hover:text-indigo-600 rounded-md hover:bg-indigo-50 transition-colors"
              >
                <MoreVertical className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44 rounded-lg border-gray-100 shadow-lg p-1">
              <DropdownMenuItem onClick={() => onEdit(holiday)} className="cursor-pointer rounded-md">
                <Edit className="mr-2 h-3.5 w-3.5 text-gray-400" /> Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onToggleActive(holiday)} className="cursor-pointer rounded-md">
                {holiday.isActive ? "Deactivate" : "Activate"}
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-gray-50" />
              <DropdownMenuItem
                onClick={() => onDelete(holiday.id)}
                className="text-red-600 focus:text-red-700 focus:bg-red-50 cursor-pointer rounded-md"
              >
                <Trash2 className="mr-2 h-3.5 w-3.5" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <h4 className="font-bold text-gray-800 text-sm leading-tight line-clamp-1">
          {holiday.name}
        </h4>
        <p className="text-xs text-gray-500 mt-1">
          {new Date(holiday.date).toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })}
        </p>
        {holiday.description && (
          <p className="text-[11px] text-gray-500 leading-relaxed line-clamp-2 mt-2">
            {holiday.description}
          </p>
        )}

        <div className="flex items-center justify-between pt-3 mt-3 border-t border-gray-50">
          {holiday.isRecurring && (
            <span className="flex items-center gap-1 text-[10px] text-indigo-600 font-medium">
              <Repeat className="h-3 w-3" /> Yearly
            </span>
          )}
          <Badge
            variant="outline"
            className={`px-2 py-0 h-4.5 rounded-full text-[9px] font-bold border shadow-none ml-auto ${
              holiday.isActive
                ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                : "bg-gray-50 text-gray-400 border-gray-100"
            }`}
          >
            {holiday.isActive ? "ACTIVE" : "INACTIVE"}
          </Badge>
        </div>
      </div>
    </div>
  );
}

export default function HolidayManagementPage() {
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [weeklyOffDays, setWeeklyOffDays] = useState<WeeklyOffDay[]>([]);
  const [loading, setLoading] = useState(false);
  const [savingWeeklyOff, setSavingWeeklyOff] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingHoliday, setEditingHoliday] = useState<Holiday | null>(null);
  const [addForm, setAddForm] = useState<HolidayFormData>(EMPTY_FORM);
  const [editForm, setEditForm] = useState<HolidayFormData>(EMPTY_FORM);
  const [searchQuery, setSearchQuery] = useState("");
  const [formLoading, setFormLoading] = useState(false);

  const fetchHolidays = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/holidays");
      const data = await res.json();
      if (data.success) setHolidays(data.data || []);
    } catch {
      toast({ title: "Error", description: "Failed to load holidays", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const fetchWeeklyOff = async () => {
    try {
      const res = await fetch("/api/weekly-off");
      const data = await res.json();
      if (data.success) setWeeklyOffDays(data.data || []);
    } catch {
      toast({ title: "Error", description: "Failed to load weekly-off configuration", variant: "destructive" });
    }
  };

  useEffect(() => {
    fetchHolidays();
    fetchWeeklyOff();
  }, []);

  const handleSaveWeeklyOff = async (activeWeekDays: number[]) => {
    setSavingWeeklyOff(true);
    try {
      const res = await fetch("/api/weekly-off", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ activeWeekDays }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Failed to save");
      setWeeklyOffDays(data.data);
      toast({ title: "Success", description: "Weekly off configuration updated" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to save weekly-off configuration", variant: "destructive" });
    } finally {
      setSavingWeeklyOff(false);
    }
  };

  const handleAdd = async () => {
    setFormLoading(true);
    try {
      const res = await fetch("/api/holidays", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(addForm),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Failed to add holiday");
      setHolidays((prev) => [...prev, data.data]);
      setAddForm(EMPTY_FORM);
      setShowAddDialog(false);
      toast({ title: "Success", description: "Holiday added successfully" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to add holiday", variant: "destructive" });
    } finally {
      setFormLoading(false);
    }
  };

  const handleEdit = async () => {
    if (!editingHoliday) return;
    setFormLoading(true);
    try {
      const res = await fetch(`/api/holidays/${editingHoliday.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Failed to update holiday");
      setHolidays((prev) => prev.map((h) => (h.id === editingHoliday.id ? data.data : h)));
      setEditingHoliday(null);
      toast({ title: "Success", description: "Holiday updated successfully" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to update holiday", variant: "destructive" });
    } finally {
      setFormLoading(false);
    }
  };

  const handleToggleActive = async (holiday: Holiday) => {
    try {
      const res = await fetch(`/api/holidays/${holiday.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !holiday.isActive }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Failed to update holiday");
      setHolidays((prev) => prev.map((h) => (h.id === holiday.id ? data.data : h)));
      toast({
        title: "Success",
        description: `Holiday ${data.data.isActive ? "activated" : "deactivated"}`,
      });
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to update holiday", variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this holiday? This cannot be undone.")) return;
    try {
      const res = await fetch(`/api/holidays/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Failed to delete holiday");
      setHolidays((prev) => prev.filter((h) => h.id !== id));
      toast({ title: "Success", description: "Holiday deleted successfully" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to delete holiday", variant: "destructive" });
    }
  };

  const openEdit = (holiday: Holiday) => {
    setEditForm({
      name: holiday.name,
      date: holiday.date.slice(0, 10),
      description: holiday.description || "",
      isRecurring: holiday.isRecurring,
      isActive: holiday.isActive,
    });
    setEditingHoliday(holiday);
  };

  const filteredHolidays = holidays.filter((h) =>
    h.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <DashboardLayout>
      <div className="bg-indigo-50/30 rounded-xl p-6 mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Holiday Management</h2>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
              <Input
                placeholder="Search holidays..."
                className="bg-white pl-9 pr-8 w-64 border-gray-200 focus:border-indigo-400 rounded-lg shadow-sm text-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            <Button
              onClick={() => {
                setAddForm(EMPTY_FORM);
                setShowAddDialog(true);
              }}
              className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-sm h-10 px-4 flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Holiday
            </Button>
          </div>
        </div>

        <WeeklyOffCard days={weeklyOffDays} onSave={handleSaveWeeklyOff} saving={savingWeeklyOff} />

        {loading && holidays.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-gray-100 shadow-sm">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-indigo-600 border-t-transparent mb-3" />
            <p className="text-sm text-gray-500 font-medium">Loading holidays...</p>
          </div>
        )}

        {!loading && holidays.length === 0 && (
          <div className="text-center py-20 bg-white rounded-xl border border-gray-100 shadow-sm">
            <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <CalendarOff className="h-8 w-8 text-gray-200" />
            </div>
            <h3 className="text-lg font-bold text-gray-800 mb-1">No holidays configured</h3>
            <p className="text-sm text-gray-500 max-w-xs mx-auto mb-6">
              Add your first holiday to start blocking bookings on that date
            </p>
          </div>
        )}

        {filteredHolidays.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredHolidays.map((holiday) => (
              <HolidayCard
                key={holiday.id}
                holiday={holiday}
                onEdit={openEdit}
                onDelete={handleDelete}
                onToggleActive={handleToggleActive}
              />
            ))}
          </div>
        )}

        {!loading && holidays.length > 0 && filteredHolidays.length === 0 && (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
            <Search className="h-12 w-12 text-gray-200 mx-auto mb-3" />
            <p className="text-sm text-gray-500">No holidays match your search</p>
          </div>
        )}
      </div>

      <Dialog
        open={showAddDialog || editingHoliday !== null}
        onOpenChange={(open) => {
          if (!open) {
            setShowAddDialog(false);
            setEditingHoliday(null);
            setAddForm(EMPTY_FORM);
            setEditForm(EMPTY_FORM);
          }
        }}
      >
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingHoliday ? "Edit Holiday" : "Add New Holiday"}</DialogTitle>
          </DialogHeader>
          {editingHoliday ? (
            <HolidayForm
              data={editForm}
              onChange={setEditForm}
              onSubmit={handleEdit}
              onCancel={() => {
                setEditingHoliday(null);
                setEditForm(EMPTY_FORM);
              }}
              loading={formLoading}
              mode="edit"
            />
          ) : (
            <HolidayForm
              data={addForm}
              onChange={setAddForm}
              onSubmit={handleAdd}
              onCancel={() => {
                setShowAddDialog(false);
                setAddForm(EMPTY_FORM);
              }}
              loading={formLoading}
              mode="add"
            />
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
