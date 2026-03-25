"use client";

import { useState, useEffect } from "react";
import {
  Plus,
  Edit,
  Trash2,
  Settings,
  ToggleLeft,
  ToggleRight,
  ShieldCheck,
  Stethoscope,
  Clock,
  LayoutGrid,
  MoreVertical,
  X,
  Search,
  Activity,
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
          <Label
            htmlFor="svc-name"
            className="text-sm font-medium text-gray-700"
          >
            Service Name
          </Label>
          <Input
            id="svc-name"
            placeholder="e.g. Therapeutic Exercise"
            value={data.name}
            onChange={(e) => onChange({ ...data, name: e.target.value })}
            className="border-gray-200 focus:border-indigo-400 rounded-lg shadow-sm"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="grid gap-1.5">
            <Label
              htmlFor="svc-category"
              className="text-sm font-medium text-gray-700"
            >
              Category
            </Label>
            <Select
              value={data.category}
              onValueChange={(v: ServiceCategory) =>
                onChange({ ...data, category: v })
              }
            >
              <SelectTrigger
                id="svc-category"
                className="border-gray-200 rounded-lg shadow-sm"
              >
                <SelectValue placeholder="Select" />
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
            <Label
              htmlFor="svc-price"
              className="text-sm font-medium text-gray-700"
            >
              Price (₹)
            </Label>
            <Input
              id="svc-price"
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={data.price}
              onChange={(e) => onChange({ ...data, price: e.target.value })}
              className="border-gray-200 rounded-lg shadow-sm"
            />
          </div>
        </div>
        <div className="grid gap-1.5">
          <Label
            htmlFor="svc-desc"
            className="text-sm font-medium text-gray-700"
          >
            Description
          </Label>
          <Textarea
            id="svc-desc"
            placeholder="Clinical description of the service..."
            rows={3}
            value={data.description}
            onChange={(e) => onChange({ ...data, description: e.target.value })}
            className="border-gray-200 rounded-lg shadow-sm resize-none"
          />
        </div>
        <div
          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100 cursor-pointer hover:bg-gray-100/80 transition-colors"
          onClick={() => onChange({ ...data, isActive: !data.isActive })}
        >
          <div className="flex items-center gap-3">
            <div
              className={`p-1.5 rounded-md ${data.isActive ? "bg-indigo-100 text-indigo-600" : "bg-gray-200 text-gray-500"}`}
            >
              {data.isActive ? (
                <ShieldCheck className="h-3.5 w-3.5" />
              ) : (
                <Clock className="h-3.5 w-3.5" />
              )}
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-700 leading-none">
                Available Status
              </p>
              <p className="text-[11px] text-gray-400 mt-1">
                {data.isActive ? "Visible in catalog" : "Hidden from catalog"}
              </p>
            </div>
          </div>
          {data.isActive ? (
            <ToggleRight className="h-5 w-5 text-indigo-600" />
          ) : (
            <ToggleLeft className="h-5 w-5 text-gray-300" />
          )}
        </div>
      </div>
      <DialogFooter className="gap-2">
        <Button variant="outline" onClick={onCancel} className="rounded-lg">
          Cancel
        </Button>
        <Button
          onClick={onSubmit}
          disabled={loading || !data.name || !data.price}
          className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-sm"
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
  const { icon: CategoryIcon, label: categoryLabel } =
    ServiceCategoryOptionsMap[service.category];

  return (
    <div
      className={`group bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden ${!service.isActive ? "opacity-75 grayscale-[0.3]" : ""}`}
    >
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div
            className="p-2 rounded-lg transition-colors"
            style={{ backgroundColor: `${colors.hex}15`, color: colors.hex }}
          >
            <CategoryIcon className="h-4 w-4" />
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
                onClick={() => onToggleActive(service.id, !service.isActive)}
                className="cursor-pointer rounded-md focus:bg-indigo-50 focus:text-indigo-700"
              >
                {service.isActive ? (
                  <>
                    <ToggleLeft className="mr-2 h-3.5 w-3.5 text-gray-400" />{" "}
                    Deactivate
                  </>
                ) : (
                  <>
                    <ToggleRight className="mr-2 h-3.5 w-3.5 text-emerald-500" />{" "}
                    Activate
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onEdit(service)}
                className="cursor-pointer rounded-md focus:bg-indigo-50 focus:text-indigo-700"
              >
                <Edit className="mr-2 h-3.5 w-3.5 text-gray-400" /> Edit Details
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-gray-50" />
              <DropdownMenuItem
                onClick={() => onDelete(service.id)}
                className="text-red-600 focus:text-red-700 focus:bg-red-50 cursor-pointer rounded-md"
              >
                <Trash2 className="mr-2 h-3.5 w-3.5" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="mb-2">
          <h4 className="font-bold text-gray-800 text-sm leading-tight line-clamp-1 group-hover:text-indigo-600 transition-colors">
            {service.name}
          </h4>
          <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wider mt-1 block">
            {categoryLabel}
          </span>
        </div>

        <p className="text-[11px] text-gray-500 leading-relaxed line-clamp-2 min-h-[2rem] mb-4">
          {service.description ||
            "Medical service specialized for therapeutic care and patient recovery."}
        </p>

        <div className="flex items-center justify-between pt-3 border-t border-gray-50">
          <div className="flex items-baseline gap-1">
            <span className="text-[10px] font-semibold text-gray-400">₹</span>
            <span className="text-base font-bold text-gray-900 tracking-tight">
              {service.price.toLocaleString("en-IN")}
            </span>
          </div>
          <Badge
            variant="outline"
            className={`px-2 py-0 h-4.5 rounded-full text-[9px] font-bold border shadow-none ${
              service.isActive
                ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                : "bg-gray-50 text-gray-400 border-gray-100"
            }`}
          >
            {service.isActive ? "ACTIVE" : "INACTIVE"}
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
    {
      label: "Total Services",
      value: services.length,
      icon: LayoutGrid,
      color: "text-indigo-600",
      bg: "bg-indigo-50",
    },
    {
      label: "Active",
      value: active,
      icon: ShieldCheck,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
    },
    {
      label: "Inactive",
      value: inactive,
      icon: Clock,
      color: "text-gray-400",
      bg: "bg-gray-100",
    },
    {
      label: "Categories",
      value: categoryCount,
      icon: Stethoscope,
      color: "text-indigo-600",
      bg: "bg-indigo-50",
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

// ── Main Page ─────────────────────────────────────────────────────────────────

const ServiceManagement = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [addForm, setAddForm] = useState<ServiceFormData>(EMPTY_FORM);
  const [editForm, setEditForm] = useState<ServiceFormData>(EMPTY_FORM);
  const [searchQuery, setSearchQuery] = useState("");

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
      toast({
        title: "Success",
        description: "Service added successfully",
        variant: "default",
      });
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
      toast({
        title: "Success",
        description: "Service updated successfully",
        variant: "default",
      });
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
      toast({
        title: "Success",
        description: `Service ${isActive ? "activated" : "deactivated"} successfully`,
        variant: "default",
      });
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
      toast({
        title: "Success",
        description: "Service deleted successfully",
        variant: "default",
      });
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

  const filteredServices = services.filter(
    (s) =>
      s.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      false ||
      s.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      false,
  );

  return (
    <DashboardLayout>
      <div className="bg-indigo-50/30 rounded-xl p-6 mb-8">
        {/* Header Section - Matches Patient Page */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">
              Service Management
            </h2>
            <p className="text-sm text-gray-500 mt-0.5">
              {services.length > 0
                ? `${services.length} services available`
                : "Manage your healthcare services"}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* Search Bar - Matches Patient Page */}
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
              <Input
                placeholder="Search services..."
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
              Add Service
            </Button>
          </div>
        </div>

        {/* Stats Bar */}
        {services.length > 0 && <StatsBar services={services} />}

        {/* Loading / Empty States */}
        {loading && services.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-gray-100 shadow-sm">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-indigo-600 border-t-transparent mb-3" />
            <p className="text-sm text-gray-500 font-medium">
              Loading services...
            </p>
          </div>
        )}

        {!loading && services.length === 0 && (
          <div className="text-center py-20 bg-white rounded-xl border border-gray-100 shadow-sm">
            <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Settings className="h-8 w-8 text-gray-200" />
            </div>
            <h3 className="text-lg font-bold text-gray-800 mb-1">
              No services found
            </h3>
            <p className="text-sm text-gray-500 max-w-xs mx-auto mb-6">
              Start by adding your first medical service to the catalog.
            </p>
            <Button
              onClick={() => setShowAddDialog(true)}
              variant="outline"
              className="border-indigo-200 text-indigo-600 hover:bg-indigo-50 rounded-lg font-medium"
            >
              Add New Service
            </Button>
          </div>
        )}

        {/* Category Sections */}
        <div className="space-y-10">
          {AllServiceCatagory.map((cat) => {
            const catServices = filteredServices.filter(
              (s) => s.category === cat,
            );
            if (catServices.length === 0) return null;

            const {
              label,
              icon: Icon,
              colors,
            } = ServiceCategoryOptionsMap[cat];

            return (
              <div key={cat}>
                {/* Section Header */}
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className="p-1.5 rounded-lg"
                    style={{
                      backgroundColor: `${colors.hex}15`,
                      color: colors.hex,
                    }}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">
                    {label}
                  </h3>
                  <div className="h-px flex-1 bg-gray-100"></div>
                  <span className="text-[10px] font-bold text-gray-400 px-2 py-0.5 rounded-full bg-gray-50 border border-gray-100">
                    {catServices.length} ITEMS
                  </span>
                </div>

                {/* Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
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
      </div>

      {/* Dialogs */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-md rounded-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="p-1.5 bg-indigo-50 rounded-lg">
                <Plus className="h-4 w-4 text-indigo-600" />
              </div>
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

      <Dialog
        open={editingService !== null}
        onOpenChange={(open) => {
          if (!open) setEditingService(null);
        }}
      >
        <DialogContent className="sm:max-w-md rounded-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="p-1.5 bg-indigo-50 rounded-lg">
                <Edit className="h-4 w-4 text-indigo-600" />
              </div>
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
