import { useEffect, useState } from "react";
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
import { z } from "zod";
import { passwordSchema } from "@/lib/validations/user";
import { RoleColors, UserRoleLabel, UserStatusLabel } from "@/lib/userRoles";
import { UserRole } from "@/lib/generated/userRoles";
import { User } from "@/types/user";
import { PaginationInfo } from "@/types";
import { EmployeeProfileCard } from "./employee-profile-card";
import { UserStatus } from "@/lib/generated/userEnums";

interface EmployeeTableProps {
  users: User[];
  loading: boolean;
  pagination: PaginationInfo;
  onPageChange: (currentPage: number) => void;
  onUserUpdated: () => void;
}

export function EmployeeTable({
  users,
  loading,
  pagination,
  onPageChange,
  onUserUpdated,
}: EmployeeTableProps) {
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [resetPasswordDialogOpen, setResetPasswordDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusBadge = (status: UserStatus) => {
    return (
      <Badge
        variant={status === UserStatus.ACTIVE ? "default" : "secondary"}
        className={
          status === UserStatus.ACTIVE
            ? "bg-green-100 text-green-800"
            : "bg-gray-100 text-gray-800"
        }
      >
        {UserStatusLabel[status]}
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
      const newStatus =
        user.status === UserStatus.ACTIVE
          ? UserStatus.INACTIVE
          : UserStatus.ACTIVE;

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
        description: `User ${newStatus} successfully`,
      });

      onUserUpdated();
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

    const result = passwordSchema.safeParse(newPassword);

    if (!result.success) {
      setError(result.error.errors[0].message);
      return;
    }

    setError("");

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
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {
                        <Badge className={`${RoleColors[user.role]} `}>
                          {UserRoleLabel[user.role]}
                        </Badge>
                      }
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.phone || "No Caller ID"}</TableCell>
                    <TableCell>{getStatusBadge(user.status)}</TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {formatDate(user.createdAt)}
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
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
                                handleResetPassword(user);
                              }}
                            >
                              <Key className="mr-2 h-4 w-4" />
                              Reset Password
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className={
                                user.status === UserStatus.ACTIVE
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
                              {user.status === UserStatus.ACTIVE
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
                Showing {(pagination.currentPage - 1) * pagination.limit + 1} to{" "}
                {Math.min(
                  pagination.currentPage * pagination.limit,
                  pagination.totalCount
                )}{" "}
                of {pagination.totalCount} employees
              </span>
              <div className="flex gap-2 items-center">
                <Button
                  size="sm"
                  variant="outline"
                  className="border-indigo-600 text-indigo-700 hover:bg-indigo-50"
                  disabled={pagination.currentPage === 1}
                  onClick={() => onPageChange(pagination.currentPage - 1)}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>

                <div className="flex items-center space-x-1">
                  {Array.from(
                    { length: pagination.totalPages },
                    (_, i) => i + 1
                  ).map((pg) => (
                    <Button
                      key={pg}
                      size="sm"
                      variant={
                        pg === pagination.currentPage ? "default" : "outline"
                      }
                      className={
                        pg === pagination.currentPage
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
                  disabled={pagination.currentPage === pagination.totalPages}
                  onClick={() => onPageChange(pagination.currentPage + 1)}
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
              {error && <p style={{ color: "red" }}>{error}</p>}

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
