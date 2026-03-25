"use client";

import { useState, useEffect } from "react";
import {
  Plus,
  Edit,
  Trash2,
  Settings,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
import { toast } from "@/components/ui/use-toast";
import { Service } from "@/types/service";
import { ServiceCategory } from "@/lib/generated/serviceEnums";
import {
  AllServiceCatagory,
  ServiceCategoryLabel,
  ServiceCategoryOptionsMap,
  ServiceCategoryColors,
} from "@/lib/service";

// ── Service Form (shared by Add + Edit) ──────────────────────────────────────

interface ServiceFormData {
  name: string;
  description: string;
  price: string;
  category: ServiceCategory;
  isActive: boolean;
}

const EMPTY_FORM: ServiceFormData = {
  name: "",
  description: "",
  price: "",
  category: ServiceCategory.MANUAL_THERAPY,
  isActive: true,
};

interface ServiceFormProps {
  data: ServiceFormData;
  onChange: (data: ServiceFormData) => void;
  onSubmit: () => void;
  onCancel: () => void;
  loading: boolean;
  mode: "add" | "edit";
}

function ServiceForm({
  data,
  onChange,
  onSubmit,
  onCancel,
  loading,
  mode,
}: ServiceFormProps) {
  return (
    <>
      <div className="grid gap-4 py-4">
        <div className="grid gap-1.5">
          <Label htmlFor="svc-name">Service Name</Label>
          <Input
            id="svc-name"
            placeholder="e.g. Deep Tissue Massage"
            value={data.name}
            onChange={(e) => onChange({ ...data, name: e.target.value })}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="grid gap-1.5">
            <Label htmlFor="svc-category">Category</Label>
            <Select
              value={data.category}
              onValueChange={(v: ServiceCategory) =>
                onChange({ ...data, category: v })
              }
            >
              <SelectTrigger id="svc-category">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {AllServiceCatagory.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {ServiceCategoryLabel[cat]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="svc-price">Price (₹)</Label>
            <Input
              id="svc-price"
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={data.price}
              onChange={(e) => onChange({ ...data, price: e.target.value })}
            />
          </div>
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="svc-desc">Description</Label>
          <Textarea
            id="svc-desc"
            placeholder="Describe the service..."
            rows={3}
            value={data.description}
            onChange={(e) => onChange({ ...data, description: e.target.value })}
          />
        </div>
        <div
          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer"
          onClick={() => onChange({ ...data, isActive: !data.isActive })}
        >
          <div>
            <p className="text-sm font-medium text-gray-700">Active Service</p>
            <p className="text-xs text-gray-400">
              Visible and bookable by patients
            </p>
          </div>
          {data.isActive ? (
            <ToggleRight className="h-6 w-6 text-indigo-600" />
          ) : (
            <ToggleLeft className="h-6 w-6 text-gray-400" />
          )}
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          onClick={onSubmit}
          disabled={loading || !data.name || !data.price}
          className="bg-indigo-600 hover:bg-indigo-700"
        >
          {loading
            ? "Saving..."
            : mode === "add"
              ? "Add Service"
              : "Save Changes"}
        </Button>
      </DialogFooter>
    </>
  );
}

// ── Service Card ──────────────────────────────────────────────────────────────

interface ServiceCardProps {
  service: Service;
  onEdit: (service: Service) => void;
  onDelete: (id: string) => void;
  onToggleActive: (id: string, isActive: boolean) => void;
}

function ServiceCard({
  service,
  onEdit,
  onDelete,
  onToggleActive,
}: ServiceCardProps) {
  const colors = ServiceCategoryColors[service.category];

  return (
    <div
      className={`bg-white rounded-xl border hover:shadow-md transition-shadow ${!service.isActive ? "opacity-60" : ""}`}
      style={{ borderColor: `${colors.hex}40` }}
    >
      {/* Color accent bar */}
      <div className="h-1 rounded-t-xl" style={{ backgroundColor: colors.hex }} />

      <div className="p-4">
        {/* Name + actions */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex-1 min-w-0">
            <p className="font-bold text-sm text-gray-800 truncate leading-snug">
              {service.name}
            </p>
            <p className="text-[11px] text-gray-400 mt-0.5 tracking-wide">
              Added{" "}
              {new Date(service.createdAt).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </p>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              onClick={() => onToggleActive(service.id, !service.isActive)}
              className="p-1.5 rounded-md text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
              title={service.isActive ? "Deactivate" : "Activate"}
            >
              {service.isActive ? (
                <ToggleRight className="h-3.5 w-3.5" />
              ) : (
                <ToggleLeft className="h-3.5 w-3.5" />
              )}
            </button>
            <button
              onClick={() => onEdit(service)}
              className="p-1.5 rounded-md text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
            >
              <Edit className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => onDelete(service.id)}
              className="p-1.5 rounded-md text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Description */}
        <p className="text-xs text-gray-500 leading-relaxed line-clamp-2 mb-3">
          {service.description || (
            <span className="text-gray-300 italic">No description</span>
          )}
        </p>

        {/* Price + status */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-50">
          <div className="flex items-baseline gap-0.5">
            <span className="text-xs text-gray-400 font-medium">₹</span>
            <span
              className="text-lg font-extrabold tracking-tight"
              style={{ color: colors.hex }}
            >
              {service.price.toLocaleString("en-IN")}
            </span>
          </div>
          <Badge
            className={`text-[11px] font-semibold border-0 ${
              service.isActive
                ? "bg-emerald-50 text-emerald-700"
                : "bg-gray-100 text-gray-400"
            }`}
          >
            {service.isActive ? "Active" : "Inactive"}
          </Badge>
        </div>
      </div>
    </div>
  );
}

// ── Stats bar ─────────────────────────────────────────────────────────────────

function StatsBar({ services }: { services: Service[] }) {
  const active = services.filter((s) => s.isActive).length;
  const inactive = services.length - active;
  const categoryCount = AllServiceCatagory.filter((c) =>
    services.some((s) => s.category === c),
  ).length;

  const stats = [
    { label: "Total Services", value: services.length, color: "text-gray-800" },
    { label: "Active", value: active, color: "text-emerald-600" },
    { label: "Inactive", value: inactive, color: "text-gray-400" },
    { label: "Categories", value: categoryCount, color: "text-indigo-600" },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
      {stats.map(({ label, value, color }) => (
        <div
          key={label}
          className="bg-white rounded-xl border border-gray-100 px-4 py-3"
        >
          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest">
            {label}
          </p>
          <p className={`text-3xl font-extrabold mt-1 ${color}`}>{value}</p>
        </div>
      ))}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

const ServiceManagement = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [addForm, setAddForm] = useState<ServiceFormData>(EMPTY_FORM);
  const [editForm, setEditForm] = useState<ServiceFormData>(EMPTY_FORM);

  const fetchServices = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/services?includeInactive=true");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setServices(Array.isArray(data.data) ? data.data : []);
    } catch {
      toast({
        title: "Error",
        description: "Failed to load services",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const handleAdd = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...addForm, price: parseFloat(addForm.price) }),
      });
      if (!res.ok) throw new Error();
      const { data } = await res.json();
      setServices((prev) => [...prev, data]);
      setAddForm(EMPTY_FORM);
      setShowAddDialog(false);
      toast({ title: "Service added successfully" });
    } catch {
      toast({
        title: "Error",
        description: "Failed to add service",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async () => {
    if (!editingService) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/services/${editingService.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...editForm,
          price: parseFloat(editForm.price),
        }),
      });
      if (!res.ok) throw new Error();
      const updated = await res.json();
      setServices((prev) =>
        prev.map((s) => (s.id === editingService.id ? updated : s)),
      );
      setEditingService(null);
      toast({ title: "Service updated successfully" });
    } catch {
      toast({
        title: "Error",
        description: "Failed to update service",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (id: string, isActive: boolean) => {
    try {
      const res = await fetch(`/api/services/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive }),
      });
      if (!res.ok) throw new Error();
      setServices((prev) =>
        prev.map((s) => (s.id === id ? { ...s, isActive } : s)),
      );
      toast({ title: `Service ${isActive ? "activated" : "deactivated"}` });
    } catch {
      toast({
        title: "Error",
        description: "Failed to update status",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this service? This cannot be undone.")) return;
    try {
      await fetch(`/api/services/${id}`, { method: "DELETE" });
      setServices((prev) => prev.filter((s) => s.id !== id));
      toast({ title: "Service deleted" });
    } catch {
      toast({
        title: "Error",
        description: "Failed to delete service",
        variant: "destructive",
      });
    }
  };

  const openEdit = (service: Service) => {
    setEditForm({
      name: service.name,
      description: service.description || "",
      price: String(service.price),
      category: service.category,
      isActive: service.isActive,
    });
    setEditingService(service);
  };

  return (
    <DashboardLayout>
      <div className="bg-indigo-50/30 rounded-xl p-6 mb-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <Settings className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-gray-800">
                Service Management
              </h2>
              <p className="text-sm text-gray-400 mt-0.5">
                {services.length > 0
                  ? `${services.length} services across ${AllServiceCatagory.filter((c) => services.some((s) => s.category === c)).length} categories`
                  : "Manage your healthcare services"}
              </p>
            </div>
          </div>
          <Button
            onClick={() => {
              setAddForm(EMPTY_FORM);
              setShowAddDialog(true);
            }}
            className="bg-indigo-600 hover:bg-indigo-700 flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Service
          </Button>
        </div>

        {/* Stats */}
        {services.length > 0 && <StatsBar services={services} />}

        {/* Loading */}
        {loading && services.length === 0 && (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-indigo-600 border-t-transparent" />
          </div>
        )}

        {/* Empty */}
        {!loading && services.length === 0 && (
          <div className="text-center py-20">
            <Settings className="h-10 w-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No services yet</p>
            <p className="text-sm text-gray-400 mt-1">
              Click "Add Service" to get started
            </p>
          </div>
        )}

        {/* Category sections */}
        {AllServiceCatagory.map((cat) => {
          const catServices = services.filter((s) => s.category === cat);
          if (catServices.length === 0) return null;

          const { label, icon: Icon, colors } = ServiceCategoryOptionsMap[cat];

          return (
            <div key={cat} className="mb-8">
              {/* Section heading */}
              <div
                className="flex items-center gap-3 px-4 py-2.5 rounded-xl mb-3 border"
                style={{ backgroundColor: `${colors.hex}18`, borderColor: `${colors.hex}40` }}
              >
                <Icon className="h-4 w-4" style={{ color: colors.hex }} />
                <h3 className="text-xs font-bold uppercase tracking-widest" style={{ color: colors.hex }}>
                  {label}
                </h3>
                <span
                  className="ml-auto text-[11px] font-semibold px-2 py-0.5 rounded-full bg-white/60"
                  style={{ color: colors.hex }}
                >
                  {catServices.length} service{catServices.length !== 1 ? "s" : ""}
                </span>
              </div>

              {/* Cards grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {catServices.map((service) => (
                  <ServiceCard
                    key={service.id}
                    service={service}
                    onEdit={openEdit}
                    onDelete={handleDelete}
                    onToggleActive={handleToggleActive}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-4 w-4 text-indigo-600" />
              Add New Service
            </DialogTitle>
          </DialogHeader>
          <ServiceForm
            data={addForm}
            onChange={setAddForm}
            onSubmit={handleAdd}
            onCancel={() => setShowAddDialog(false)}
            loading={loading}
            mode="add"
          />
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog
        open={editingService !== null}
        onOpenChange={(open) => {
          if (!open) setEditingService(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-4 w-4 text-indigo-600" />
              Edit Service
            </DialogTitle>
          </DialogHeader>
          <ServiceForm
            data={editForm}
            onChange={setEditForm}
            onSubmit={handleEdit}
            onCancel={() => setEditingService(null)}
            loading={loading}
            mode="edit"
          />
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default ServiceManagement;
