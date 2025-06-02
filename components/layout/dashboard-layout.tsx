"use client";

import type React from "react";

import { useState } from "react";
import { Menu, Bell, LogOut } from "lucide-react";
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
import { ChevronDown, User, HelpCircle, Moon } from "lucide-react";
import { Toaster } from "@/components/ui/toaster";

// Add this function to capitalize first letter
const capitalizeFirstLetter = (str: string) => {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

interface DashboardLayoutProps {
  children: React.ReactNode;
  userRole?: "receptionist" | "admin" | "content-manager" | "therapist";
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { user, logout } = useAuth();

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  return (
    <div className="flex min-h-screen flex-col bg-gray-100">
      <Toaster />
      <div className="flex flex-1">
        {/* Sidebar */}
        <div
          className={`${
            sidebarCollapsed ? "w-16" : "w-64"
          } transition-all duration-300 ease-in-out flex flex-col`}
        >
          <Sidebar
            collapsed={sidebarCollapsed}
            userRole={
              user?.role?.toLowerCase() as
                | "receptionist"
                | "admin"
                | "content-manager"
                | "therapist"
            }
          />
        </div>
        <div className="flex-1 flex flex-col overflow-hidden">
          <header className="bg-white border-b border-gray-200 z-10 shadow-sm">
            <div className="flex items-center justify-between px-6 py-3">
              {/* Left Section */}
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

              {/* Right Section */}
              <div className="flex items-center space-x-3">
                {/* Notifications */}
                <div className="relative">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-gray-600 hover:bg-gray-100 hover:text-gray-800 transition-colors relative"
                  >
                    <Bell className="h-5 w-5" />
                    {/* Notification Badge */}
                    <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white rounded-full text-xs flex items-center justify-center font-medium">
                      3
                    </span>
                  </Button>
                </div>

                {/* User Profile Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="relative h-auto w-auto p-2 rounded-full hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        {/* Enhanced Avatar */}
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
                          {/* Online Status Indicator */}
                          <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 bg-green-500 border-2 border-white rounded-full"></div>
                        </div>

                        {/* User Info */}
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

                        {/* Dropdown Chevron */}
                        <ChevronDown className="h-4 w-4 text-gray-400" />
                      </div>
                    </Button>
                  </DropdownMenuTrigger>

                  <DropdownMenuContent align="end" className="w-64 p-2">
                    {/* User Info Header */}
                    <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg mb-2">
                      <Avatar className="h-12 w-12">
                        <AvatarImage
                          src={
                            user?.avatar ||
                            `https://ui-avatars.com/api/?name=${encodeURIComponent(
                              user?.name || "User"
                            )}&background=4f46e5&color=ffffff&size=128&font-size=0.5`
                          }
                          alt={user?.name || "User"}
                        />
                        <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-semibold">
                          {user?.name
                            ?.split(" ")
                            .map((n) => n[0])
                            .join("")
                            .slice(0, 2) || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 truncate">
                          {user?.name || "User Name"}
                        </p>
                        <p className="text-sm text-gray-500 truncate">
                          {user?.email || "user@example.com"}
                        </p>
                        <div className="flex items-center mt-1">
                          <div className="h-2 w-2 bg-green-500 rounded-full mr-2"></div>
                          <span className="text-xs text-green-600 font-medium">
                            {user?.role
                              ? capitalizeFirstLetter(user.role)
                              : "Administrator"}
                          </span>
                        </div>
                      </div>
                    </div>

                    <DropdownMenuSeparator />

                    {/* Menu Items */}
                    <DropdownMenuItem className="cursor-pointer hover:bg-gray-50 rounded-md p-3">
                      <User className="h-4 w-4 mr-3 text-gray-500" />
                      <div>
                        <p className="font-medium text-gray-800">My Profile</p>
                        <p className="text-xs text-gray-500">
                          View and edit your profile
                        </p>
                      </div>
                    </DropdownMenuItem>

                    <DropdownMenuItem className="cursor-pointer hover:bg-gray-50 rounded-md p-3">
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

                    {/* Theme Toggle */}
                    <DropdownMenuItem className="cursor-pointer hover:bg-gray-50 rounded-md p-3">
                      <Moon className="h-4 w-4 mr-3 text-gray-500" />
                      <div className="flex items-center justify-between w-full">
                        <div>
                          <p className="font-medium text-gray-800">Dark Mode</p>
                          <p className="text-xs text-gray-500">Toggle theme</p>
                        </div>
                        {/* Toggle Switch */}
                        <div className="relative inline-flex h-5 w-9 items-center rounded-full bg-gray-200 transition-colors">
                          <span className="inline-block h-3 w-3 transform rounded-full bg-white transition-transform translate-x-1" />
                        </div>
                      </div>
                    </DropdownMenuItem>

                    <DropdownMenuSeparator />

                    {/* Logout */}
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

          {/* Main Content Area */}
          <main className="flex-1 overflow-y-auto p-6 bg-gray-50">
            {children}
          </main>

          {/* Footer */}
          <Footer />
        </div>
      </div>
    </div>
  );
}
