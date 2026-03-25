"use client";

import { useState, useEffect } from "react";
import {
  Plus,
  Edit,
  Trash2,
  MapPin,
  Home,
  LayoutGrid,
  MoreVertical,
  X,
  Search,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/contexts/auth-context";
import { toast } from "@/components/ui/use-toast";

interface Cubicle {
  id: string;
  name: string;
  description?: string;
  roomNumber?: string;
  location?: string;
  status: "ACTIVE" | "INACTIVE" | "MAINTENANCE";
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  _count?: {
    appointments: number;
  };
}

interface CubicleFormData {
  name: string;
  description: string;
  roomNumber: string;
  location: string;
  status: "ACTIVE" | "INACTIVE" | "MAINTENANCE";
}

const EMPTY_FORM: CubicleFormData = {
  name: "",
  description: "",
  roomNumber: "",
  location: "",
  status: "ACTIVE",
};

interface CubicleFormProps {
  data: CubicleFormData;
  onChange: (data: CubicleFormData) => void;
  onSubmit: () => void;
  onCancel: () => void;
  loading: boolean;
  mode: "add" | "edit";
}

function CubicleForm({
  data,
  onChange,
  onSubmit,
  onCancel,
  loading,
  mode,
}: CubicleFormProps) {
  return (
    <>
      <div className="grid gap-4 py-4">
        <div className="grid gap-1.5">
          <Label
            htmlFor="cub-name"
            className="text-sm font-medium text-gray-700"
          >
            Cubicle Name
          </Label>
          <Input
            id="cub-name"
            placeholder="e.g., Therapy Room 1"
            value={data.name}
            onChange={(e) => onChange({ ...data, name: e.target.value })}
            className="border-gray-200 focus:border-indigo-400 rounded-lg shadow-sm"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="grid gap-1.5">
            <Label
              htmlFor="cub-room"
              className="text-sm font-medium text-gray-700"
            >
              Room Number
            </Label>
            <Input
              id="cub-room"
              placeholder="e.g., R-101"
              value={data.roomNumber}
              onChange={(e) =>
                onChange({ ...data, roomNumber: e.target.value })
              }
              className="border-gray-200 rounded-lg shadow-sm"
            />
          </div>
          <div className="grid gap-1.5">
            <Label
              htmlFor="cub-location"
              className="text-sm font-medium text-gray-700"
            >
              Location/Floor
            </Label>
            <Input
              id="cub-location"
              placeholder="e.g., 1st Floor"
              value={data.location}
              onChange={(e) => onChange({ ...data, location: e.target.value })}
              className="border-gray-200 rounded-lg shadow-sm"
            />
          </div>
        </div>
        <div className="grid gap-1.5">
          <Label
            htmlFor="cub-status"
            className="text-sm font-medium text-gray-700"
          >
            Status
          </Label>
          <Select
            value={data.status}
            onValueChange={(v: "ACTIVE" | "INACTIVE" | "MAINTENANCE") =>
              onChange({ ...data, status: v })
            }
          >
            <SelectTrigger
              id="cub-status"
              className="border-gray-200 rounded-lg shadow-sm"
            >
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ACTIVE">Active</SelectItem>
              <SelectItem value="INACTIVE">Inactive</SelectItem>
              <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-1.5">
          <Label
            htmlFor="cub-desc"
            className="text-sm font-medium text-gray-700"
          >
            Description
          </Label>
          <Textarea
            id="cub-desc"
            placeholder="Additional details about this cubicle..."
            rows={3}
            value={data.description}
            onChange={(e) => onChange({ ...data, description: e.target.value })}
            className="border-gray-200 rounded-lg shadow-sm resize-none"
          />
        </div>
      </div>
      <DialogFooter className="gap-2">
        <Button variant="outline" onClick={onCancel} className="rounded-lg">
          Cancel
        </Button>
        <Button
          onClick={onSubmit}
          disabled={loading || !data.name}
          className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-sm"
        >
          {loading
            ? "Saving..."
            : mode === "add"
              ? "Add Cubicle"
              : "Save Changes"}
        </Button>
      </DialogFooter>
    </>
  );
}

interface CubicleCardProps {
  cubicle: Cubicle;
  onEdit: (cubicle: Cubicle) => void;
  onDelete: (id: string) => void;
}

function CubicleCard({ cubicle, onEdit, onDelete }: CubicleCardProps) {
  const getStatusStyles = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return {
          bg: "bg-emerald-50",
          text: "text-emerald-600",
          border: "border-emerald-100",
        };
      case "MAINTENANCE":
        return {
          bg: "bg-amber-50",
          text: "text-amber-600",
          border: "border-amber-100",
        };
      case "INACTIVE":
        return {
          bg: "bg-gray-50",
          text: "text-gray-400",
          border: "border-gray-100",
        };
      default:
        return {
          bg: "bg-gray-50",
          text: "text-gray-400",
          border: "border-gray-100",
        };
    }
  };

  const statusStyles = getStatusStyles(cubicle.status);

  return (
    <div
      className={`group bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden ${!cubicle.status || cubicle.status !== "ACTIVE" ? "opacity-75" : ""}`}
    >
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="p-2 rounded-lg bg-indigo-100 text-indigo-600">
            <Home className="h-4 w-4" />
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
            <DropdownMenuContent
              align="end"
              className="w-44 rounded-lg border-gray-100 shadow-lg p-1"
            >
              <DropdownMenuItem
                onClick={() => onEdit(cubicle)}
                className="cursor-pointer rounded-md focus:bg-indigo-50 focus:text-indigo-700"
              >
                <Edit className="mr-2 h-3.5 w-3.5 text-gray-400" /> Edit Details
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-gray-50" />
              <DropdownMenuItem
                onClick={() => onDelete(cubicle.id)}
                className="text-red-600 focus:text-red-700 focus:bg-red-50 cursor-pointer rounded-md"
              >
                <Trash2 className="mr-2 h-3.5 w-3.5" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="mb-2">
          <h4 className="font-bold text-gray-800 text-sm leading-tight line-clamp-1 group-hover:text-indigo-600 transition-colors">
            {cubicle.name}
          </h4>
          {cubicle.roomNumber && (
            <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wider mt-1 block">
              Room {cubicle.roomNumber}
            </span>
          )}
        </div>

        <p className="text-[11px] text-gray-500 leading-relaxed line-clamp-2 min-h-[2rem] mb-4">
          {cubicle.description ||
            "Therapy room for patient treatment and rehabilitation."}
        </p>

        <div className="flex items-center justify-between pt-3 border-t border-gray-50">
          {cubicle.location && (
            <div className="flex items-center gap-1 text-[11px] text-gray-500">
              <MapPin className="h-3.5 w-3.5" />
              {cubicle.location}
            </div>
          )}
          <Badge
            variant="outline"
            className={`px-2 py-0 h-4.5 rounded-full text-[9px] font-bold border shadow-none ${statusStyles.bg} ${statusStyles.text} ${statusStyles.border}`}
          >
            {cubicle.status}
          </Badge>
        </div>
      </div>
    </div>
  );
}

function StatsBar({ cubicles }: { cubicles: Cubicle[] }) {
  const active = cubicles.filter((c) => c.status === "ACTIVE").length;
  const maintenance = cubicles.filter((c) => c.status === "MAINTENANCE").length;
  const inactive = cubicles.filter((c) => c.status === "INACTIVE").length;

  const stats = [
    {
      label: "Total Cubicles",
      value: cubicles.length,
      icon: LayoutGrid,
      color: "text-indigo-600",
      bg: "bg-indigo-50",
    },
    {
      label: "Active",
      value: active,
      icon: Home,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
    },
    {
      label: "Maintenance",
      value: maintenance,
      icon: MapPin,
      color: "text-amber-600",
      bg: "bg-amber-50",
    },
    {
      label: "Inactive",
      value: inactive,
      icon: X,
      color: "text-gray-400",
      bg: "bg-gray-100",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
      {stats.map(({ label, value, icon: Icon, color, bg }) => (
        <div
          key={label}
          className="bg-white rounded-xl border border-gray-100 px-4 py-3 shadow-sm flex items-center gap-3"
        >
          <div className={`p-2 rounded-lg ${bg} ${color}`}>
            <Icon className="h-4 w-4" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
              {label}
            </p>
            <p className="text-lg font-bold text-gray-800 leading-none mt-1">
              {value}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

const CubicleManagement = () => {
  const { user } = useAuth();
  const [cubicles, setCubicles] = useState<Cubicle[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingCubicle, setEditingCubicle] = useState<Cubicle | null>(null);
  const [addForm, setAddForm] = useState<CubicleFormData>(EMPTY_FORM);
  const [editForm, setEditForm] = useState<CubicleFormData>(EMPTY_FORM);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchCubicles = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/cubicles");
      if (!response.ok) throw new Error("Failed to fetch cubicles");
      const data = await response.json();
      setCubicles(data.cubicles || []);
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to load cubicles",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    if (!user?.id) {
      toast({
        title: "Error",
        description: "User not authenticated",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/cubicles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...addForm,
          createdBy: user.id,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to add cubicle");
      }

      const data = await response.json();
      setCubicles((prev) => [...prev, data]);
      setAddForm(EMPTY_FORM);
      setShowAddDialog(false);
      toast({
        title: "Success",
        description: "Cubicle added successfully",
        variant: "default",
      });
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to add cubicle",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async () => {
    if (!editingCubicle) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/cubicles/${editingCubicle.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update cubicle");
      }

      const updated = await response.json();
      setCubicles((prev) =>
        prev.map((c) => (c.id === editingCubicle.id ? updated : c)),
      );
      setEditingCubicle(null);
      toast({
        title: "Success",
        description: "Cubicle updated successfully",
        variant: "default",
      });
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to update cubicle",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this cubicle? This cannot be undone.")) return;

    try {
      const response = await fetch(`/api/cubicles/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete cubicle");
      }

      setCubicles((prev) => prev.filter((c) => c.id !== id));
      toast({
        title: "Success",
        description: "Cubicle deleted successfully",
        variant: "default",
      });
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to delete cubicle",
        variant: "destructive",
      });
    }
  };

  const openEdit = (cubicle: Cubicle) => {
    setEditForm({
      name: cubicle.name,
      description: cubicle.description || "",
      roomNumber: cubicle.roomNumber || "",
      location: cubicle.location || "",
      status: cubicle.status,
    });
    setEditingCubicle(cubicle);
  };

  const filteredCubicles = cubicles.filter(
    (c) =>
      c.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      false ||
      c.location?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      false ||
      c.roomNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      false,
  );

  useEffect(() => {
    fetchCubicles();
  }, []);

  return (
    <DashboardLayout>
      <div className="bg-indigo-50/30 rounded-xl p-6 mb-8">
        {/* Header Section - Matches Services Page */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">
              Cubicle Management
            </h2>
          </div>
          <div className="flex items-center gap-3">
            {/* Search Bar - Matches Services Page */}
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
              <Input
                placeholder="Search cubicles..."
                className="bg-white pl-9 pr-8 w-64 border-gray-200 focus:border-indigo-400 rounded-lg shadow-sm text-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500 transition-colors"
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
              className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-sm h-10 px-4 transition-all active:scale-95 flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Cubicle
            </Button>
          </div>
        </div>

        {/* Stats Bar */}
        {cubicles.length > 0 && <StatsBar cubicles={cubicles} />}

        {/* Loading / Empty States */}
        {loading && cubicles.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-gray-100 shadow-sm">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-indigo-600 border-t-transparent mb-3" />
            <p className="text-sm text-gray-500 font-medium">
              Loading cubicles...
            </p>
          </div>
        )}

        {!loading && cubicles.length === 0 && (
          <div className="text-center py-20 bg-white rounded-xl border border-gray-100 shadow-sm">
            <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Home className="h-8 w-8 text-gray-200" />
            </div>
            <h3 className="text-lg font-bold text-gray-800 mb-1">
              No cubicles found
            </h3>
            <p className="text-sm text-gray-500 max-w-xs mx-auto mb-6">
              Create your first therapy room to start managing your spaces
            </p>
            <Button
              onClick={() => {
                setAddForm(EMPTY_FORM);
                setShowAddDialog(true);
              }}
              className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-sm"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add First Cubicle
            </Button>
          </div>
        )}

        {/* Cubicles Grid */}
        {filteredCubicles.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCubicles.map((cubicle) => (
              <CubicleCard
                key={cubicle.id}
                cubicle={cubicle}
                onEdit={openEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}

        {!loading && cubicles.length > 0 && filteredCubicles.length === 0 && (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
            <Search className="h-12 w-12 text-gray-200 mx-auto mb-3" />
            <p className="text-sm text-gray-500">
              No cubicles match your search
            </p>
          </div>
        )}
      </div>

      {/* Add/Edit Dialog */}
      <Dialog
        open={showAddDialog || editingCubicle !== null}
        onOpenChange={(open) => {
          if (!open) {
            setShowAddDialog(false);
            setEditingCubicle(null);
            setAddForm(EMPTY_FORM);
            setEditForm(EMPTY_FORM);
          }
        }}
      >
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingCubicle ? "Edit Cubicle" : "Add New Cubicle"}
            </DialogTitle>
          </DialogHeader>
          {editingCubicle ? (
            <CubicleForm
              data={editForm}
              onChange={setEditForm}
              onSubmit={handleEdit}
              onCancel={() => {
                setEditingCubicle(null);
                setEditForm(EMPTY_FORM);
              }}
              loading={loading}
              mode="edit"
            />
          ) : (
            <CubicleForm
              data={addForm}
              onChange={setAddForm}
              onSubmit={handleAdd}
              onCancel={() => {
                setShowAddDialog(false);
                setAddForm(EMPTY_FORM);
              }}
              loading={loading}
              mode="add"
            />
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default CubicleManagement;
