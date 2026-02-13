"use client";
import { useState, useEffect } from "react";
import { Plus, Edit, Trash2, MapPin, Home } from "lucide-react";
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

const CubicleManagement = () => {
  const { user } = useAuth();
  const [cubicles, setCubicles] = useState<Cubicle[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingCubicle, setEditingCubicle] = useState<Cubicle | null>(null);
  const [formData, setFormData] = useState<{
    name: string;
    description: string;
    roomNumber: string;
    location: string;
    status: "ACTIVE" | "INACTIVE" | "MAINTENANCE";
  }>({
    name: "",
    description: "",
    roomNumber: "",
    location: "",
    status: "ACTIVE",
  });

  // Fetch cubicles
  const fetchCubicles = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/cubicles");
      if (!response.ok) throw new Error("Failed to fetch cubicles");
      const data = await response.json();
      setCubicles(data.cubicles || []);
    } catch (err) {
      console.error("Error fetching cubicles:", err);
      toast({
        title: "Error",
        description: "Failed to load cubicles",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Add cubicle
  const handleAddCubicle = async () => {
    if (!formData.name) {
      toast({
        title: "Validation Error",
        description: "Cubicle name is required",
        variant: "destructive",
      });
      return;
    }

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
          ...formData,
          createdBy: user.id,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to add cubicle");
      }

      const data = await response.json();
      toast({
        title: "Success",
        description: data.message || "Cubicle created successfully",
      });

      setFormData({
        name: "",
        description: "",
        roomNumber: "",
        location: "",
        status: "ACTIVE",
      });
      setShowAddDialog(false);
      fetchCubicles();
    } catch (err: any) {
      console.error("Error adding cubicle:", err);
      toast({
        title: "Error",
        description: err.message || "Failed to add cubicle",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Update cubicle
  const handleUpdateCubicle = async () => {
    if (!editingCubicle) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/cubicles/${editingCubicle.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update cubicle");
      }

      const data = await response.json();
      toast({
        title: "Success",
        description: data.message || "Cubicle updated successfully",
      });

      setEditingCubicle(null);
      setFormData({
        name: "",
        description: "",
        roomNumber: "",
        location: "",
        status: "ACTIVE",
      });
      fetchCubicles();
    } catch (err: any) {
      console.error("Error updating cubicle:", err);
      toast({
        title: "Error",
        description: err.message || "Failed to update cubicle",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Delete cubicle
  const handleDeleteCubicle = async (id: string) => {
    if (!confirm("Are you sure you want to deactivate this cubicle?")) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/cubicles/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete cubicle");
      }

      const data = await response.json();
      toast({
        title: "Success",
        description: data.message || "Cubicle deactivated successfully",
      });

      fetchCubicles();
    } catch (err: any) {
      console.error("Error deleting cubicle:", err);
      toast({
        title: "Error",
        description: err.message || "Failed to delete cubicle",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle edit dialog open
  const handleEditDialogOpen = (cubicle: Cubicle) => {
    setFormData({
      name: cubicle.name,
      description: cubicle.description || "",
      roomNumber: cubicle.roomNumber || "",
      location: cubicle.location || "",
      status: cubicle.status,
    });
    setEditingCubicle(cubicle);
  };

  useEffect(() => {
    fetchCubicles();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "bg-green-100 text-green-700 border-green-300";
      case "INACTIVE":
        return "bg-red-100 text-red-700 border-red-300";
      case "MAINTENANCE":
        return "bg-yellow-100 text-yellow-700 border-yellow-300";
      default:
        return "bg-gray-100 text-gray-700 border-gray-300";
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Cubicle Management
            </h1>
            <p className="text-gray-600">
              Manage therapy rooms and treatment spaces
            </p>
          </div>
          <Button
            onClick={() => setShowAddDialog(true)}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Cubicle
          </Button>
        </div>

        {/* Add/Edit Cubicle Dialog */}
        <Dialog
          open={showAddDialog || editingCubicle !== null}
          onOpenChange={(open) => {
            if (!open) {
              setShowAddDialog(false);
              setEditingCubicle(null);
              setFormData({
                name: "",
                description: "",
                roomNumber: "",
                location: "",
                status: "ACTIVE",
              });
            }
          }}
        >
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>
                {editingCubicle ? "Edit Cubicle" : "Add New Cubicle"}
              </DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">
                  Cubicle Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  placeholder="e.g., Therapy Room 1"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="roomNumber">Room Number</Label>
                  <Input
                    id="roomNumber"
                    placeholder="e.g., R-101"
                    value={formData.roomNumber}
                    onChange={(e) =>
                      setFormData({ ...formData, roomNumber: e.target.value })
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="location">Location/Floor</Label>
                  <Input
                    id="location"
                    placeholder="e.g., 1st Floor"
                    value={formData.location}
                    onChange={(e) =>
                      setFormData({ ...formData, location: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: "ACTIVE" | "INACTIVE" | "MAINTENANCE") =>
                    setFormData({ ...formData, status: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="INACTIVE">Inactive</SelectItem>
                    <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Additional details about this cubicle..."
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setShowAddDialog(false);
                  setEditingCubicle(null);
                  setFormData({
                    name: "",
                    description: "",
                    roomNumber: "",
                    location: "",
                    status: "ACTIVE",
                  });
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={editingCubicle ? handleUpdateCubicle : handleAddCubicle}
                disabled={loading}
              >
                {loading
                  ? "Saving..."
                  : editingCubicle
                    ? "Update Cubicle"
                    : "Create Cubicle"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Cubicles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cubicles.map((cubicle) => (
            <div
              key={cubicle.id}
              className={`border-2 rounded-lg p-5 transition-all duration-200 hover:shadow-lg ${
                cubicle.status === "ACTIVE"
                  ? "border-green-200 bg-white"
                  : cubicle.status === "MAINTENANCE"
                    ? "border-yellow-200 bg-yellow-50"
                    : "border-gray-200 bg-gray-50 opacity-75"
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="font-bold text-lg text-gray-900 flex items-center gap-2">
                    <Home className="h-5 w-5 text-gray-600" />
                    {cubicle.name}
                  </h3>
                  {cubicle.roomNumber && (
                    <p className="text-sm text-gray-600 mt-1">
                      Room: {cubicle.roomNumber}
                    </p>
                  )}
                  {cubicle.location && (
                    <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                      <MapPin className="h-3 w-3" />
                      {cubicle.location}
                    </p>
                  )}
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => handleEditDialogOpen(cubicle)}
                    className="text-gray-400 hover:text-blue-600 transition-colors p-1"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteCubicle(cubicle.id)}
                    className="text-gray-400 hover:text-red-600 transition-colors p-1"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {cubicle.description && (
                <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                  {cubicle.description}
                </p>
              )}

              <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                <span
                  className={`text-xs px-3 py-1 rounded-full font-medium border ${getStatusColor(
                    cubicle.status
                  )}`}
                >
                  {cubicle.status}
                </span>
                {cubicle._count && (
                  <span className="text-xs text-gray-500">
                    {cubicle._count.appointments} appointments
                  </span>
                )}
              </div>

              <div className="mt-3 pt-3 border-t border-gray-100">
                <p className="text-xs text-gray-400">
                  Created: {new Date(cubicle.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          ))}
        </div>

        {cubicles.length === 0 && !loading && (
          <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
            <Home className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">
              No Cubicles Yet
            </h3>
            <p className="text-gray-500 mb-4">
              Create your first therapy room to start scheduling appointments
            </p>
            <Button onClick={() => setShowAddDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add First Cubicle
            </Button>
          </div>
        )}

        {loading && (
          <div className="text-center py-12">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
            <p className="text-gray-500 mt-4">Loading cubicles...</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default CubicleManagement;
