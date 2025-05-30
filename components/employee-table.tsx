import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/components/ui/use-toast";
import {
  Edit,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  User as UserIcon,
  Mail,
  Phone,
  Calendar,
  Shield,
  Clock,
  Key,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff } from "lucide-react";

export interface User {
  id: string;
  name: string;
  email: string;
  role: "admin" | "therapist" | "receptionist" | "content_manager";
  phone?: string;
  status: "active" | "inactive";
  createdAt: string;
  updatedAt: string;
}

export interface PaginationInfo {
  total: number;
  pages: number;
  page: number;
  limit: number;
}

interface EmployeeTableProps {
  users: User[];
  loading: boolean;
  pagination: PaginationInfo;
  onPageChange: (page: number) => void;
  onUserUpdated: () => void;
}

export function EmployeeTable({
  users,
  loading,
  pagination,
  onPageChange,
  onUserUpdated,
}: EmployeeTableProps) {
  // State for different modals/dialogs
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [resetPasswordDialogOpen, setResetPasswordDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getRoleBadge = (role: string) => {
    const roleStyles = {
      admin: "bg-red-100 text-red-800",
      therapist: "bg-blue-100 text-blue-800",
      receptionist: "bg-green-100 text-green-800",
      content_manager: "bg-purple-100 text-purple-800",
    };

    const roleLabels = {
      admin: "Administrator",
      therapist: "Therapist",
      receptionist: "Receptionist",
      content_manager: "Content Manager",
    };

    return (
      <Badge className={roleStyles[role as keyof typeof roleStyles]}>
        {roleLabels[role as keyof typeof roleLabels]}
      </Badge>
    );
  };

  const getStatusBadge = (status: string) => {
    return (
      <Badge
        variant={status === "active" ? "default" : "secondary"}
        className={
          status === "active"
            ? "bg-green-100 text-green-800"
            : "bg-gray-100 text-gray-800"
        }
      >
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  // Handle profile view
  const handleViewProfile = (user: User) => {
    setSelectedUser(user);
    setProfileDialogOpen(true);
  };

  // Handle schedule view
  const handleViewSchedule = (user: User) => {
    setSelectedUser(user);
    setScheduleDialogOpen(true);
  };

  // Handle password reset
  const handleResetPassword = (user: User) => {
    setSelectedUser(user);
    setNewPassword("");
    setResetPasswordDialogOpen(true);
  };

  // Handle status toggle (activate/deactivate)
  const handleToggleStatus = async (user: User) => {
    try {
      setIsLoading(true);
      const newStatus = user.status === "active" ? "inactive" : "active";

      const response = await fetch(`/api/users/${user.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: newStatus,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update user status");
      }

      toast({
        title: "Success",
        description: `User ${
          newStatus === "active" ? "activated" : "deactivated"
        } successfully`,
      });

      onUserUpdated(); // Refresh the users list
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update user status",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle password reset submission
  const handleSubmitPasswordReset = async () => {
    if (!selectedUser || !newPassword) return;

    try {
      setIsLoading(true);

      const response = await fetch(
        `/api/users/${selectedUser.id}/reset-password`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            newPassword,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to reset password");
      }

      toast({
        title: "Success",
        description: "Password reset successfully",
      });

      setResetPasswordDialogOpen(false);
      setNewPassword("");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to reset password",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (loading) {
    return (
      <CardContent className="p-4">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          <span className="ml-3 text-gray-600">Loading employees...</span>
        </div>
      </CardContent>
    );
  }

  return (
    <>
      <CardContent className="p-4">
        <div className="overflow-x-auto bg-white rounded-b-lg">
          <Table>
            <TableHeader>
              <TableRow className="bg-indigo-700">
                <TableHead className="whitespace-nowrap font-semibold text-white">
                  Employee
                </TableHead>
                <TableHead className="whitespace-nowrap font-semibold text-white">
                  Role
                </TableHead>
                <TableHead className="whitespace-nowrap font-semibold text-white">
                  Email
                </TableHead>
                <TableHead className="whitespace-nowrap font-semibold text-white">
                  Phone
                </TableHead>
                <TableHead className="whitespace-nowrap font-semibold text-white">
                  Status
                </TableHead>
                <TableHead className="whitespace-nowrap font-semibold text-white">
                  Joined
                </TableHead>
                <TableHead className="whitespace-nowrap font-semibold text-white">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-center py-8 text-gray-500"
                  >
                    No employees found.
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => (
                  <TableRow key={user.id} className="hover:bg-gray-50">
                    <TableCell>
                      <div className="flex items-center">
                        <Avatar className="h-8 w-8 mr-3">
                          <AvatarFallback>
                            {user.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                              .toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{user.name}</p>
                          <p className="text-sm text-gray-500">
                            ID: {user.id.slice(0, 8)}...
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{getRoleBadge(user.role)}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.phone || "N/A"}</TableCell>
                    <TableCell>{getStatusBadge(user.status)}</TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {formatDate(user.createdAt)}
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleViewProfile(user)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>

                          <DropdownMenuContent
                            align="end"
                            onCloseAutoFocus={(e) => e.preventDefault()}
                          >
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                handleViewProfile(user);
                              }}
                            >
                              <UserIcon className="mr-2 h-4 w-4" />
                              View Profile
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                handleViewSchedule(user);
                              }}
                            >
                              <Calendar className="mr-2 h-4 w-4" />
                              View Schedule
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                handleResetPassword(user);
                              }}
                            >
                              <Key className="mr-2 h-4 w-4" />
                              Reset Password
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className={
                                user.status === "active"
                                  ? "text-red-600"
                                  : "text-green-600"
                              }
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleStatus(user);
                              }}
                              disabled={isLoading}
                            >
                              <Shield className="mr-2 h-4 w-4" />
                              {user.status === "active"
                                ? "Deactivate"
                                : "Activate"}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {/* Pagination Controls */}
          {users.length > 0 && (
            <div className="flex justify-between items-center p-4 bg-white border-t">
              <span className="text-sm text-gray-700">
                Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
                {Math.min(pagination.page * pagination.limit, pagination.total)}{" "}
                of {pagination.total} employees
              </span>
              <div className="flex gap-2 items-center">
                <Button
                  size="sm"
                  variant="outline"
                  className="border-indigo-600 text-indigo-700 hover:bg-indigo-50"
                  disabled={pagination.page === 1}
                  onClick={() => onPageChange(pagination.page - 1)}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>

                <div className="flex items-center space-x-1">
                  {Array.from(
                    { length: pagination.pages },
                    (_, i) => i + 1
                  ).map((pg) => (
                    <Button
                      key={pg}
                      size="sm"
                      variant={pg === pagination.page ? "default" : "outline"}
                      className={
                        pg === pagination.page
                          ? "bg-indigo-600 text-white hover:bg-indigo-700 border-indigo-600"
                          : "border-indigo-600 text-indigo-700 hover:bg-indigo-50"
                      }
                      onClick={() => onPageChange(pg)}
                    >
                      {pg}
                    </Button>
                  ))}
                </div>

                <Button
                  size="sm"
                  variant="outline"
                  className="border-indigo-600 text-indigo-700 hover:bg-indigo-50"
                  disabled={pagination.page === pagination.pages}
                  onClick={() => onPageChange(pagination.page + 1)}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </CardContent>

      {/* Profile Dialog */}
      <Dialog
        open={profileDialogOpen}
        onOpenChange={setProfileDialogOpen}
        modal={false}
      >
        <DialogContent
          className="max-w-2xl max-h-[90vh] overflow-y-auto"
          onInteractOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={() => setProfileDialogOpen(false)}
        >
          <DialogHeader>
            <DialogTitle>Employee Profile</DialogTitle>
          </DialogHeader>
          {selectedUser && <EmployeeProfileCard user={selectedUser} />}
        </DialogContent>
      </Dialog>

      {/* Schedule Dialog */}
      <Dialog
        open={scheduleDialogOpen}
        onOpenChange={setScheduleDialogOpen}
        modal={false}
      >
        <DialogContent
          className="max-w-4xl max-h-[90vh] overflow-y-auto"
          onInteractOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={() => setScheduleDialogOpen(false)}
        >
          <DialogHeader>
            <DialogTitle>Session Schedule</DialogTitle>
          </DialogHeader>
          {selectedUser && <EmployeeScheduleCard user={selectedUser} />}
        </DialogContent>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog
        open={resetPasswordDialogOpen}
        onOpenChange={setResetPasswordDialogOpen}
        modal={false}
      >
        <DialogContent
          className="max-w-md"
          onInteractOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={() => setResetPasswordDialogOpen(false)}
        >
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4">
              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <Avatar className="h-10 w-10">
                  <AvatarFallback>
                    {selectedUser.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{selectedUser.name}</p>
                  <p className="text-sm text-gray-500">{selectedUser.email}</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter new password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowPassword(!showPassword);
                    }}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-500" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-500" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="flex space-x-2 pt-4">
                <Button
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    setResetPasswordDialogOpen(false);
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSubmitPasswordReset();
                  }}
                  disabled={!newPassword || isLoading}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700"
                >
                  {isLoading ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                      Resetting...
                    </div>
                  ) : (
                    "Reset Password"
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

// ====================================================================
// COMPONENT: Employee Profile Card
// ====================================================================

interface EmployeeProfileCardProps {
  user: User;
}

function EmployeeProfileCard({ user }: EmployeeProfileCardProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getRoleInfo = (role: string) => {
    const roleInfo = {
      admin: {
        title: "Administrator",
        description: "Full system access and user management",
        color: "text-red-600 bg-red-50",
      },
      therapist: {
        title: "Therapist",
        description: "Patient care and treatment management",
        color: "text-blue-600 bg-blue-50",
      },
      receptionist: {
        title: "Receptionist",
        description: "Patient registration and appointment scheduling",
        color: "text-green-600 bg-green-50",
      },
      content_manager: {
        title: "Content Manager",
        description: "Blog posts and content management",
        color: "text-purple-600 bg-purple-50",
      },
    };
    return roleInfo[role as keyof typeof roleInfo] || roleInfo.therapist;
  };

  const roleInfo = getRoleInfo(user.role);

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-3">
          <Avatar className="h-16 w-16">
            <AvatarFallback className="text-lg">
              {user.name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{user.name}</h2>
            <div
              className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${roleInfo.color}`}
            >
              <Shield className="w-4 h-4 mr-1" />
              {roleInfo.title}
            </div>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Basic Information */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            Basic Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center space-x-3">
              <UserIcon className="h-5 w-5 text-gray-500" />
              <div>
                <p className="text-sm font-medium text-gray-500">Full Name</p>
                <p className="text-gray-900">{user.name}</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <Mail className="h-5 w-5 text-gray-500" />
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Email Address
                </p>
                <p className="text-gray-900">{user.email}</p>
              </div>
            </div>

            {user.phone && (
              <div className="flex items-center space-x-3">
                <Phone className="h-5 w-5 text-gray-500" />
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Phone Number
                  </p>
                  <p className="text-gray-900">{user.phone}</p>
                </div>
              </div>
            )}

            <div className="flex items-center space-x-3">
              <Badge
                variant={user.status === "active" ? "default" : "secondary"}
                className={
                  user.status === "active"
                    ? "bg-green-100 text-green-800"
                    : "bg-gray-100 text-gray-800"
                }
              >
                {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
              </Badge>
            </div>
          </div>
        </div>

        {/* Role Information */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            Role & Permissions
          </h3>
          <div className={`p-4 rounded-lg ${roleInfo.color}`}>
            <h4 className="font-medium">{roleInfo.title}</h4>
            <p className="text-sm mt-1">{roleInfo.description}</p>
          </div>
        </div>

        {/* Account Information */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            Account Information
          </h3>
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <Calendar className="h-5 w-5 text-gray-500" />
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Account Created
                </p>
                <p className="text-gray-900">{formatDate(user.createdAt)}</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <Clock className="h-5 w-5 text-gray-500" />
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Last Updated
                </p>
                <p className="text-gray-900">{formatDate(user.updatedAt)}</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <Key className="h-5 w-5 text-gray-500" />
              <div>
                <p className="text-sm font-medium text-gray-500">User ID</p>
                <p className="text-gray-900 font-mono text-sm">{user.id}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats (if user is therapist) */}
        {user.role === "therapist" && (
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Quick Stats
            </h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <p className="text-2xl font-bold text-blue-600">12</p>
                <p className="text-sm text-blue-600">Active Patients</p>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <p className="text-2xl font-bold text-green-600">8</p>
                <p className="text-sm text-green-600">Today's Sessions</p>
              </div>
              <div className="text-center p-3 bg-amber-50 rounded-lg">
                <p className="text-2xl font-bold text-amber-600">95%</p>
                <p className="text-sm text-amber-600">Success Rate</p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ====================================================================
// COMPONENT: Employee Schedule Card
// ====================================================================

function EmployeeScheduleCard({ user }: EmployeeProfileCardProps) {
  // Mock schedule data - replace with real API call
  const scheduleData = [
    {
      time: "09:00 AM",
      patient: "John Doe",
      type: "Physical Therapy",
      status: "confirmed",
    },
    {
      time: "10:00 AM",
      patient: "Jane Smith",
      type: "Consultation",
      status: "completed",
    },
    { time: "11:00 AM", patient: "Break", type: "Break Time", status: "break" },
    {
      time: "11:30 AM",
      patient: "Bob Johnson",
      type: "Follow-up",
      status: "confirmed",
    },
    {
      time: "02:00 PM",
      patient: "Alice Wilson",
      type: "Initial Assessment",
      status: "pending",
    },
    {
      time: "03:00 PM",
      patient: "Charlie Brown",
      type: "Physical Therapy",
      status: "confirmed",
    },
    {
      time: "04:00 PM",
      patient: "Available",
      type: "Open Slot",
      status: "available",
    },
  ];

  const getStatusBadge = (status: string) => {
    const statusStyles = {
      confirmed: "bg-blue-100 text-blue-800",
      completed: "bg-green-100 text-green-800",
      pending: "bg-yellow-100 text-yellow-800",
      available: "bg-gray-100 text-gray-800",
      break: "bg-purple-100 text-purple-800",
    };

    return (
      <Badge className={statusStyles[status as keyof typeof statusStyles]}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-3">
          <Calendar className="h-6 w-6 text-indigo-600" />
          <div>
            <h2 className="text-xl font-bold">Schedule for {user.name}</h2>
            <p className="text-sm text-gray-500">
              Today's appointments and availability
            </p>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {scheduleData.map((appointment, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
            >
              <div className="flex items-center space-x-4">
                <div className="text-center">
                  <p className="font-medium text-indigo-600">
                    {appointment.time}
                  </p>
                </div>
                <div>
                  <p className="font-medium">{appointment.patient}</p>
                  <p className="text-sm text-gray-500">{appointment.type}</p>
                </div>
              </div>
              <div>{getStatusBadge(appointment.status)}</div>
            </div>
          ))}
        </div>

        <div className="mt-6 p-4 bg-indigo-50 rounded-lg">
          <h4 className="font-medium text-indigo-900 mb-2">Schedule Summary</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-indigo-600 font-medium">Total Appointments</p>
              <p className="text-2xl font-bold text-indigo-900">6</p>
            </div>
            <div>
              <p className="text-green-600 font-medium">Completed</p>
              <p className="text-2xl font-bold text-green-900">1</p>
            </div>
            <div>
              <p className="text-blue-600 font-medium">Upcoming</p>
              <p className="text-2xl font-bold text-blue-900">4</p>
            </div>
            <div>
              <p className="text-gray-600 font-medium">Available Slots</p>
              <p className="text-2xl font-bold text-gray-900">1</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
