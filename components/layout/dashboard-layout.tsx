"use client";

import type React from "react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768 && mobileMenuOpen) {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [mobileMenuOpen]);
  const { user, logout } = useAuth();
  const router = useRouter();

  // Initialize session management
  useSessionManager();

  const toggleSidebar = () => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      setMobileMenuOpen(!mobileMenuOpen);
    } else {
      setSidebarCollapsed(!sidebarCollapsed);
    }
  };

  return (
    <div className="flex h-screen bg-gray-100 flex-col">
      <Toaster />
      <div className="flex flex-1 overflow-hidden relative">
        {/* Mobile Backdrop */}
        {mobileMenuOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40 md:hidden transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}
        
        {/* Fixed Sidebar */}
        <div
          className={`${
            sidebarCollapsed ? "w-16" : "w-64"
          } transition-all duration-300 ease-in-out flex-shrink-0 overflow-y-auto 
          fixed md:static z-50 h-full md:h-auto
          ${mobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
          bg-indigo-900 md:bg-transparent shadow-2xl md:shadow-none`}
        >
          <Sidebar 
            collapsed={sidebarCollapsed && !mobileMenuOpen} 
            userRole={user?.role} 
            onExpand={() => {
              if (typeof window !== 'undefined' && window.innerWidth >= 768) {
                setSidebarCollapsed(false)
              }
            }}
          />
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Fixed Header */}
          <header className="bg-white border-b border-gray-200 z-10 shadow-sm flex-shrink-0">
            <div className="flex items-center justify-between px-6 py-4">
              <div className="flex items-center space-x-4">
                <Button
                  variant="ghost"
                  onClick={toggleSidebar}
                  className="h-10 w-10 p-0 text-gray-700 hover:bg-indigo-100 hover:text-indigo-700 transition-all duration-200 rounded-lg"
                >
                  <Menu className="h-6 w-6" />
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
                          <Avatar className="h-9 w-9 md:h-10 md:w-10 ring-2 ring-white shadow-md">
                            <AvatarImage
                              src={
                                user?.avatar ||
                                `https://ui-avatars.com/api/?name=${encodeURIComponent(
                                  user?.name || "User",
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
                          <div className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 md:h-3 md:w-3 bg-green-500 border-2 border-white rounded-full"></div>
                        </div>
                        <div className="hidden sm:block text-left">
                          <p className="text-sm font-semibold text-gray-800 leading-tight">
                            {user?.name || "User Name"}
                          </p>
                          <p className="text-xs text-gray-500 leading-tight">
                            {user?.role
                              ? capitalizeFirstLetter(user.role)
                              : "Administrator"}
                          </p>
                        </div>
                        <ChevronDown className="h-4 w-4 text-gray-400 hidden sm:block" />
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

          {/* Scrollable Main Content */}
          <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-gray-50">
            {children}
          </main>

          {/* Fixed Footer */}
          <footer className="flex-shrink-0">
            <Footer />
          </footer>
        </div>
      </div>
    </div>
  );
}
