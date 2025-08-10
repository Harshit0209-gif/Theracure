"use client";
import { useState, useEffect } from "react";
import { Plus, Edit, Trash2 } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Service } from "@/types/service";
import { ServiceCategory } from "@/lib/generated/serviceEnums";
import {
  AllServiceCatagory,
  ServiceCategoryLabel,
  ServiceCategoryOptionsMap,
} from "@/lib/service";

interface CategoryColors {
  bg: string;
  border: string;
  text: string;
  accent: string;
}

interface ServiceCardProps {
  service: Service;
  colors: CategoryColors;
  editingService: string | null;
  setEditingService: (id: string | null) => void;
  onUpdate: (id: string, data: Partial<Service>) => void;
  onDelete: (id: string) => void;
  loading: boolean;
}

const ServiceManagement = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [editingService, setEditingService] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<Service>>({});
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    category: ServiceCategory.MANUAL_THERAPY,
    isActive: true,
  });

  // Fetch services
  const fetchServices = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/services");
      if (!response.ok) throw new Error("Failed to fetch services");
      const data = await response.json();
      setServices(Array.isArray(data.data) ? data.data : []);
    } catch (err) {
      console.error("Error fetching services:", err);
      setError("Failed to load services");
    } finally {
      setLoading(false);
    }
  };

  // Add service
  const handleAddService = async () => {
    if (!formData.name || !formData.description || !formData.price) {
      alert("Please fill in all fields");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          price: parseFloat(formData.price),
        }),
      });

      if (!response.ok) throw new Error("Failed to add service");

      const newService = await response.json();
      setServices([...services, newService.data]);
      setFormData({
        name: "",
        description: "",
        price: "",
        category: ServiceCategory.MANUAL_THERAPY,
        isActive: true,
      });
      setShowAddDialog(false);
    } catch (err) {
      console.error("Error adding service:", err);
      setError("Failed to add service");
    } finally {
      setLoading(false);
    }
  };

  // Update service
  const handleUpdateService = async (
    id: string,
    updatedData: Partial<Service>
  ) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/services/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedData),
      });

      if (!response.ok) throw new Error("Failed to update service");

      const updatedService = await response.json();
      setServices(services.map((s) => (s.id === id ? updatedService : s)));
      setEditingService(null);
    } catch (err) {
      console.error("Error updating service:", err);
      setError("Failed to update service");
    } finally {
      setLoading(false);
    }
  };

  // Handle edit dialog open
  const handleEditDialogOpen = (serviceId: string) => {
    const service = services.find((s) => s.id === serviceId);
    if (service) {
      setEditFormData({
        id: service.id,
        name: service.name,
        description: service.description,
        price: service.price,
        category: service.category,
        isActive: service.isActive,
        createdAt: service.createdAt,
        updatedAt: service.updatedAt,
      });
      setEditingService(serviceId);
    }
  };

  // Handle edit form submit
  const handleEditSubmit = () => {
    if (editingService) {
      handleUpdateService(editingService, editFormData);
    }
  };

  // Delete service
  const handleDeleteService = async (id: string) => {
    if (!confirm("Are you sure you want to delete this service?")) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/services/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete service");

      setServices(services.filter((s) => s.id !== id));
    } catch (err) {
      // Mock success for demo
      setServices(services.filter((s) => s.id !== id));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const ServiceCard = ({ service, colors, onDelete }: ServiceCardProps) => {
    return (
      <div
        className={`border-2 rounded-lg p-4 transition-all duration-200 ${
          colors.border
        } hover:shadow-md ${!service.isActive ? "opacity-60" : ""}`}
      >
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1">
            <h4 className="font-semibold text-sm text-gray-800 flex items-center gap-2">
              {service.name}
              {!service.isActive && (
                <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded">
                  Inactive
                </span>
              )}
            </h4>
            <p className="text-xs text-gray-400 mt-1">
              Created: {new Date(service.createdAt).toLocaleDateString()}
              {service.updatedAt !== service.createdAt && (
                <span>
                  {" "}
                  • Updated: {new Date(service.updatedAt).toLocaleDateString()}
                </span>
              )}
            </p>
          </div>
          <div className="flex gap-1">
            <button
              onClick={() => handleEditDialogOpen(service.id)}
              className="text-gray-400 hover:text-blue-600 transition-colors"
            >
              <Edit className="h-3 w-3" />
            </button>
            <button
              onClick={() => onDelete(service.id)}
              className="text-gray-400 hover:text-red-600 transition-colors"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          </div>
        </div>
        <p className="text-xs text-gray-500 mb-3 line-clamp-2">
          {service.description}
        </p>
        <div className="flex items-center justify-between">
          <p className={`text-sm font-bold ${colors.text}`}>₹{service.price}</p>
          <div className="flex items-center gap-2">
            <span
              className={`text-xs px-2 py-1 rounded ${colors.bg} ${colors.text}`}
            >
              {ServiceCategoryLabel[service.category]}
            </span>
            {service.isActive ? (
              <span
                className="w-2 h-2 bg-green-500 rounded-full"
                title="Active"
              ></span>
            ) : (
              <span
                className="w-2 h-2 bg-red-500 rounded-full"
                title="Inactive"
              ></span>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Service Management
            </h1>
            <p className="text-gray-600">Manage your healthcare services</p>
          </div>
          <Button
            onClick={() => setShowAddDialog(true)}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Service
          </Button>
        </div>

        {/* Add Service Dialog */}
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Add New Service</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Service Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="category">Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value: ServiceCategory) =>
                    setFormData({ ...formData, category: value })
                  }
                >
                  <SelectTrigger>
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
              <div className="grid gap-2">
                <Label htmlFor="price">Price (₹)</Label>
                <Input
                  id="price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) =>
                    setFormData({ ...formData, price: e.target.value })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                />
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) =>
                    setFormData({ ...formData, isActive: e.target.checked })
                  }
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <Label htmlFor="isActive">Active Service</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddService} disabled={loading}>
                {loading ? "Saving..." : "Save Service"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Service Dialog */}
        <Dialog
          open={editingService !== null}
          onOpenChange={(open) => {
            if (!open) {
              setEditingService(null);
              setEditFormData({});
            }
          }}
        >
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Edit Service</DialogTitle>
            </DialogHeader>
            {editingService !== null && (
              <>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="edit-name">Service Name</Label>
                    <Input
                      id="edit-name"
                      value={editFormData.name || ""}
                      onChange={(e) =>
                        setEditFormData({
                          ...editFormData,
                          name: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="edit-category">Category</Label>
                    <Select
                      value={editFormData.category || ""}
                      onValueChange={(value: ServiceCategory) =>
                        setEditFormData({ ...editFormData, category: value })
                      }
                    >
                      <SelectTrigger>
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
                  <div className="grid gap-2">
                    <Label htmlFor="edit-price">Price (₹)</Label>
                    <Input
                      id="edit-price"
                      type="number"
                      min="0"
                      step="0.01"
                      value={editFormData.price || ""}
                      onChange={(e) =>
                        setEditFormData({
                          ...editFormData,
                          price: parseFloat(e.target.value),
                        })
                      }
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="edit-description">Description</Label>
                    <Textarea
                      id="edit-description"
                      value={editFormData.description || ""}
                      onChange={(e) =>
                        setEditFormData({
                          ...editFormData,
                          description: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="edit-isActive"
                      checked={editFormData.isActive || false}
                      onChange={(e) =>
                        setEditFormData({
                          ...editFormData,
                          isActive: e.target.checked,
                        })
                      }
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <Label htmlFor="edit-isActive">Active Service</Label>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setEditingService(null);
                      setEditFormData({});
                    }}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleEditSubmit} disabled={loading}>
                    {loading ? "Saving..." : "Save Changes"}
                  </Button>
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>

        {/* Services List */}
        {Object.entries(ServiceCategoryOptionsMap).map(([key, category]) => {
          const categoryServices = services.filter(
            (s) => s.category === category.value
          );

          if (categoryServices.length === 0) return null;

          const colors = category.colors;
          const IconComponent = category.icon;
          console.log(services);

          return (
            <div key={category.value} className="mb-8">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <IconComponent className="w-6 h-6" />
                {category.label}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {categoryServices.map((service) => (
                  <ServiceCard
                    key={service.id}
                    service={service}
                    colors={colors}
                    editingService={editingService}
                    setEditingService={setEditingService}
                    onUpdate={handleUpdateService}
                    onDelete={handleDeleteService}
                    loading={loading}
                  />
                ))}
              </div>
            </div>
          );
        })}

        {services.length === 0 && !loading && (
          <div className="text-center py-12">
            <p className="text-gray-500">No services found.</p>
          </div>
        )}

        {loading && (
          <div className="text-center py-12">
            <p className="text-gray-500">Loading...</p>
          </div>
        )}

        {error && (
          <div className="text-center py-12">
            <p className="text-red-500">{error}</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default ServiceManagement;
