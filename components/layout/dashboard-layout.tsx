"use client";

import type React from "react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  Menu,
  Bell,
  LogOut,
  ChevronDown,
  User,
  HelpCircle,
  Moon,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sidebar } from "@/components/sidebar";
import { Footer } from "@/components/layout/footer";
import { useAuth } from "@/contexts/auth-context";
import { useSessionManager } from "@/hooks/use-session-manager";
import { Toaster } from "@/components/ui/toaster";
import { AllRoles } from "@/lib/userRoles";

const capitalizeFirstLetter = (str: string) => {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

interface DashboardLayoutProps {
  children: React.ReactNode;
  userRole?: (typeof AllRoles)[number];
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { user, logout } = useAuth();
  const router = useRouter();

  // Initialize session management
  useSessionManager();

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  return (
    <div className="flex min-h-screen flex-col bg-gray-100">
      <Toaster />
      <div className="flex flex-1">
        <div
          className={`${
            sidebarCollapsed ? "w-16" : "w-64"
          } transition-all duration-300 ease-in-out flex flex-col`}
        >
          <Sidebar collapsed={sidebarCollapsed} userRole={user?.role} />
        </div>
        <div className="flex-1 flex flex-col overflow-hidden">
          <header className="bg-white border-b border-gray-200 z-10 shadow-sm">
            <div className="flex items-center justify-between px-6 py-3">
              <div className="flex items-center space-x-4">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleSidebar}
                  className="text-gray-600 hover:bg-gray-100 hover:text-gray-800 transition-colors"
                >
                  <Menu className="h-5 w-5" />
                </Button>
              </div>

              <div className="flex items-center space-x-3">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="relative h-auto w-auto p-2 rounded-full hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="relative">
                          <Avatar className="h-10 w-10 ring-2 ring-white shadow-md">
                            <AvatarImage
                              src={
                                user?.avatar ||
                                `https://ui-avatars.com/api/?name=${encodeURIComponent(
                                  user?.name || "User"
                                )}&background=4f46e5&color=ffffff&size=128&font-size=0.5`
                              }
                              alt={user?.name || "User"}
                              className="object-cover"
                            />
                            <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-semibold">
                              {user?.name
                                ?.split(" ")
                                .map((n) => n[0])
                                .join("")
                                .slice(0, 2) || "U"}
                            </AvatarFallback>
                          </Avatar>
                          <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 bg-green-500 border-2 border-white rounded-full"></div>
                        </div>
                        <div className="hidden md:block text-left">
                          <p className="text-sm font-semibold text-gray-800 leading-tight">
                            {user?.name || "User Name"}
                          </p>
                          <p className="text-xs text-gray-500 leading-tight">
                            {user?.role
                              ? capitalizeFirstLetter(user.role)
                              : "Administrator"}
                          </p>
                        </div>
                        <ChevronDown className="h-4 w-4 text-gray-400" />
                      </div>
                    </Button>
                  </DropdownMenuTrigger>

                  <DropdownMenuContent align="end" className="w-64 p-2">
                    <DropdownMenuItem
                      className="cursor-pointer hover:bg-gray-50 rounded-md p-3"
                      onClick={() => router.push("/profile")}
                    >
                      <User className="h-4 w-4 mr-3 text-gray-500" />
                      <div>
                        <p className="font-medium text-gray-800">My Profile</p>
                        <p className="text-xs text-gray-500">
                          View and edit your profile
                        </p>
                      </div>
                    </DropdownMenuItem>

                    <DropdownMenuItem
                      className="cursor-pointer hover:bg-gray-50 rounded-md p-3"
                      onClick={() => router.push("/support")}
                    >
                      <HelpCircle className="h-4 w-4 mr-3 text-gray-500" />
                      <div>
                        <p className="font-medium text-gray-800">
                          Help & Support
                        </p>
                        <p className="text-xs text-gray-500">
                          Get help and contact support
                        </p>
                      </div>
                    </DropdownMenuItem>

                    <DropdownMenuSeparator />

                    <DropdownMenuItem
                      onClick={logout}
                      className="cursor-pointer hover:bg-red-50 rounded-md p-3 text-red-600 focus:text-red-600 focus:bg-red-50"
                    >
                      <LogOut className="h-4 w-4 mr-3" />
                      <div>
                        <p className="font-medium">Sign Out</p>
                        <p className="text-xs text-red-500">
                          Sign out of your account
                        </p>
                      </div>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto p-6 bg-gray-50">
            {children}
          </main>

          <Footer />
        </div>
      </div>
    </div>
  );
}
