import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { toast } from "@/components/ui/use-toast";
import {
  MoreHorizontal,
  User as UserIcon,
  Shield,
  Key,
  Eye,
  EyeOff,
  Users,
} from "lucide-react";
import { passwordSchema } from "@/lib/validations/user";
import { RoleColors, UserRoleLabel, UserStatusLabel } from "@/lib/userRoles";
import { UserStatus } from "@/lib/generated/userEnums";
import { User } from "@/types/user";
import { EmployeeProfileCard } from "./employee-profile-card";

interface EmployeeTableProps {
  users: User[];
  loading: boolean;
  page: number;
  pageSize: number;
  totalPages: number;
  totalCount: number;
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
  onUserUpdated: () => void;
  className?: string;
}

function initials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

export function EmployeeTable({
  users,
  loading,
  page,
  pageSize,
  totalPages,
  totalCount,
  setPage,
  setPageSize,
  onUserUpdated,
  className,
}: EmployeeTableProps) {
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [resetPasswordDialogOpen, setResetPasswordDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const handleViewProfile = (user: User) => {
    setSelectedUser(user);
    setProfileDialogOpen(true);
  };

  const handleResetPassword = (user: User) => {
    setSelectedUser(user);
    setNewPassword("");
    setError("");
    setResetPasswordDialogOpen(true);
  };

  const handleToggleStatus = async (user: User) => {
    try {
      setIsLoading(true);
      const newStatus = user.status === UserStatus.ACTIVE ? UserStatus.INACTIVE : UserStatus.ACTIVE;
      const response = await fetch(`/api/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!response.ok) throw new Error("Failed to update user status");
      toast({ title: "Success", description: `User ${newStatus.toLowerCase()} successfully` });
      onUserUpdated();
    } catch {
      toast({ title: "Error", description: "Failed to update user status", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitPasswordReset = async () => {
    if (!selectedUser || !newPassword) return;
    const result = passwordSchema.safeParse(newPassword);
    if (!result.success) { setError(result.error.issues[0].message); return; }
    setError("");
    try {
      setIsLoading(true);
      const response = await fetch(`/api/users/${selectedUser.id}/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newPassword }),
      });
      if (!response.ok) throw new Error("Failed to reset password");
      toast({ title: "Success", description: "Password reset successfully" });
      setResetPasswordDialogOpen(false);
      setNewPassword("");
    } catch {
      toast({ title: "Error", description: "Failed to reset password", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const columns: DataTableColumn<User>[] = [
    {
      header: "#",
      headerClassName: "w-14 text-center",
      cellClassName: "text-center text-sm text-gray-400 font-medium",
      cell: (_, index) => (page - 1) * pageSize + index + 1,
    },
    {
      header: "Employee",
      cell: (user) => (
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8 flex-shrink-0">
            <AvatarFallback className="bg-indigo-100 text-indigo-700 text-xs font-semibold">
              {initials(user.name)}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-semibold text-gray-800">{user.name}</p>
            <p className="text-xs text-gray-400 mt-0.5">{user.email}</p>
          </div>
        </div>
      ),
    },
    {
      header: "Role",
      cell: (user) => (
        <Badge className={`${RoleColors[user.role]} border-0`}>
          {UserRoleLabel[user.role]}
        </Badge>
      ),
    },
    {
      header: "Phone",
      cellClassName: "text-gray-600 text-sm",
      cell: (user) => user.phone || <span className="text-gray-300">—</span>,
    },
    {
      header: "Status",
      headerClassName: "text-center",
      cellClassName: "text-center",
      cell: (user) => (
        <Badge
          className={
            user.status === UserStatus.ACTIVE
              ? "bg-emerald-50 text-emerald-700 border-0 hover:bg-emerald-50"
              : user.status === UserStatus.SUSPENDED
              ? "bg-red-50 text-red-600 border-0 hover:bg-red-50"
              : "bg-gray-100 text-gray-500 border-0 hover:bg-gray-100"
          }
        >
          {UserStatusLabel[user.status]}
        </Badge>
      ),
    },
    {
      header: "Joined",
      cellClassName: "text-sm text-gray-500",
      cell: (user) =>
        new Date(user.createdAt).toLocaleDateString("en-IN", {
          year: "numeric",
          month: "short",
          day: "numeric",
        }),
    },
    {
      header: "Actions",
      headerClassName: "text-right pr-6",
      cellClassName: "text-right pr-4",
      cell: (user) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" onCloseAutoFocus={(e) => e.preventDefault()}>
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleViewProfile(user); }}>
              <UserIcon className="mr-2 h-4 w-4" />
              View Profile
            </DropdownMenuItem>
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleResetPassword(user); }}>
              <Key className="mr-2 h-4 w-4" />
              Reset Password
            </DropdownMenuItem>
            {user.status !== UserStatus.SUSPENDED && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className={user.status === UserStatus.ACTIVE ? "text-red-600" : "text-green-600"}
                  onClick={(e) => { e.stopPropagation(); handleToggleStatus(user); }}
                  disabled={isLoading}
                >
                  <Shield className="mr-2 h-4 w-4" />
                  {user.status === UserStatus.ACTIVE ? "Deactivate" : "Activate"}
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <>
      <DataTable
        columns={columns}
        data={users}
        rowKey={(u) => u.id}
        page={page}
        pageSize={pageSize}
        totalPages={totalPages}
        totalCount={totalCount}
        setPage={setPage}
        setPageSize={setPageSize}
        loading={loading}
        countIcon={<Users className="h-5 w-5" />}
        countLabel="employees"
        emptyIcon={<Users className="h-10 w-10" />}
        emptyTitle="No employees found"
        emptyDescription="Try adjusting your search or role filter"
        onRowClick={handleViewProfile}
        className={className}
      />

      {/* Profile Dialog */}
      <Dialog open={profileDialogOpen} onOpenChange={setProfileDialogOpen}>
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
      <Dialog open={resetPasswordDialogOpen} onOpenChange={setResetPasswordDialogOpen}>
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
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-indigo-100 text-indigo-700 font-semibold">
                    {initials(selectedUser.name)}
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
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={(e) => { e.stopPropagation(); setShowPassword(!showPassword); }}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4 text-gray-500" /> : <Eye className="h-4 w-4 text-gray-500" />}
                  </Button>
                </div>
              </div>
              {error && <p className="text-sm text-red-500">{error}</p>}
              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={(e) => { e.stopPropagation(); setResetPasswordDialogOpen(false); }}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700"
                  onClick={(e) => { e.stopPropagation(); handleSubmitPasswordReset(); }}
                  disabled={!newPassword || isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                      Resetting...
                    </div>
                  ) : "Reset Password"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
