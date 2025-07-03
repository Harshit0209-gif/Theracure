"use client";

import type React from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth, type UserRole } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertCircle,
  Eye,
  EyeOff,
  Heart,
  Shield,
  Stethoscope,
  User,
  Users,
  FileText,
} from "lucide-react";
import { toast } from "@/components/ui/use-toast";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("receptionist");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password, role }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to login");
      }

      // Call the login function from auth context
      await login(email, password, role);

      toast({
        title: "Login successful",
        description: "Welcome back!",
      });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Invalid credentials. Please try again."
      );
      toast({
        title: "Login failed",
        description:
          err instanceof Error
            ? err.message
            : "Invalid credentials. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const roleOptions = [
    {
      value: "receptionist",
      label: "Receptionist",
      icon: User,
      description: "Front desk and patient management",
    },
    {
      value: "content-manager",
      label: "Content Manager",
      icon: FileText,
      description: "Content and resource management",
    },
    {
      value: "admin",
      label: "Administrator",
      icon: Shield,
      description: "Full system administration",
    },
    {
      value: "therapist",
      label: "Therapist",
      icon: Stethoscope,
      description: "Patient treatment and therapy",
    },
  ];

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-indigo-700 to-purple-800">
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>

        <div className="absolute top-10 left-10 w-20 h-20 bg-white/10 rounded-full blur-xl animate-pulse"></div>
        <div className="absolute top-1/4 right-20 w-32 h-32 bg-blue-300/20 rounded-full blur-2xl animate-bounce"></div>
        <div className="absolute bottom-20 left-1/4 w-24 h-24 bg-purple-300/20 rounded-full blur-xl animate-pulse"></div>
        <div className="absolute bottom-1/3 right-10 w-16 h-16 bg-indigo-300/20 rounded-full blur-lg animate-bounce"></div>

        {/* Grid Pattern */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8ZGVmcz4KICAgIDxwYXR0ZXJuIGlkPSJncmlkIiB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHBhdHRlcm5Vbml0cz0idXNlclNwYWNlT25Vc2UiPgogICAgICA8cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJyZ2JhKDI1NSwgMjU1LCAyNTUsIDAuMDUpIiBzdHJva2Utd2lkdGg9IjEiLz4KICAgIDwvcGF0dGVybj4KICA8L2RlZnM+CiAgPHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIgLz4KPC9zdmc+')] opacity-30"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-3 sm:p-4">
        <div className="w-full max-w-md">
          <Card className="backdrop-blur-xl bg-white/95 border-white/20 shadow-2xl">
            <CardHeader className="text-center pb-4 px-4 pt-6">
              {/* Company Logo */}
              <div className="flex justify-center mb-3">
                <div className="relative">
                  <div className="flex items-center justify-center w-12 h-12">
                    <img
                      src="/favicon.png"
                      alt="Thera-Cure Logo"
                      className="w-18 h-18 object-cover rounded-full"
                    />
                  </div>
                </div>
              </div>

              {/* Company Name and Tagline */}
              <div className="space-y-1">
                <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  THERA-CURE
                </CardTitle>
                <CardDescription className="text-sm text-gray-600 font-medium">
                  Advanced Physiotherapy Clinic
                </CardDescription>
              </div>
            </CardHeader>

            <CardContent className="space-y-4 px-4 sm:px-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <Alert
                    variant="destructive"
                    className="border-red-200 bg-red-50 py-2"
                  >
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="text-red-800 text-sm">
                      {error}
                    </AlertDescription>
                  </Alert>
                )}

                {/* Email Field */}
                <div className="space-y-2">
                  <Label
                    htmlFor="email"
                    className="text-sm font-medium text-gray-700"
                  >
                    Email Address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="h-10 bg-white/50 border-gray-200 focus:border-indigo-400 focus:ring-1 focus:ring-indigo-200 transition-all duration-200 rounded-lg"
                  />
                </div>

                {/* Password Field */}
                <div className="space-y-2">
                  <Label
                    htmlFor="password"
                    className="text-sm font-medium text-gray-700"
                  >
                    Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="h-10 pr-10 bg-white/50 border-gray-200 focus:border-indigo-400 focus:ring-1 focus:ring-indigo-200 transition-all duration-200 rounded-lg"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-gray-400 hover:text-gray-600 transition-colors" />
                      ) : (
                        <Eye className="h-4 w-4 text-gray-400 hover:text-gray-600 transition-colors" />
                      )}
                    </Button>
                  </div>
                </div>

                {/* Role Selection */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium text-gray-700">
                    Select Your Role
                  </Label>
                  <RadioGroup
                    value={role}
                    onValueChange={(value) => setRole(value as UserRole)}
                    className="grid grid-cols-2 gap-2"
                  >
                    {roleOptions.map((option) => {
                      const IconComponent = option.icon;
                      const isSelected = role === option.value;
                      return (
                        <div key={option.value} className="relative">
                          <RadioGroupItem
                            value={option.value}
                            id={option.value}
                            className="sr-only"
                          />
                          <Label
                            htmlFor={option.value}
                            className={`flex flex-col items-center justify-center p-3 border-2 rounded-lg cursor-pointer transition-all duration-200 min-h-[70px] ${
                              isSelected
                                ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                                : "border-gray-200 bg-white/60 hover:border-indigo-300 hover:bg-white/80"
                            }`}
                          >
                            <IconComponent
                              className={`w-5 h-5 mb-1 transition-colors ${
                                isSelected
                                  ? "text-indigo-600"
                                  : "text-gray-500 hover:text-indigo-500"
                              }`}
                            />
                            <span className="font-medium text-xs text-center">
                              {option.label}
                            </span>
                          </Label>
                        </div>
                      );
                    })}
                  </RadioGroup>
                </div>

                {/* Login Button */}
                <Button
                  type="submit"
                  className="w-full h-10 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02]"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      <span>Signing In...</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      <span>Sign In to Dashboard</span>
                    </div>
                  )}
                </Button>
              </form>
            </CardContent>

            <CardFooter className="flex flex-col space-y-3 pt-3 pb-4 px-4">
              {/* Security Badge */}
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <Shield className="w-3 h-3 text-green-500" />
                <span>Secured with encryption</span>
              </div>

              {/* Powered by Section with Logo */}
              <div className="flex flex-col items-center space-y-2 pt-2 border-t border-gray-200">
                {/* Alternative Design Option - Horizontal Layout */}
                <div className="flex items-center space-x-2">
                  <a
                    href="https://golicit.in"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-center space-x-3 px-3 py-2 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg border border-gray-200 hover:border-indigo-300 transition-all duration-200 hover:shadow-md"
                  >
                    <img
                      src="company_logo.png"
                      alt="Golicit Logo"
                      className="w-5 h-5 object-contain"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                        (
                          (e.target as HTMLImageElement)
                            .nextElementSibling as HTMLElement
                        ).style.display = "inline";
                      }}
                    />
                    <div className="hidden w-5 h-5 bg-indigo-600 rounded text-white text-xs flex items-center justify-center font-bold">
                      G
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs font-medium text-gray-600 group-hover:text-indigo-600">
                        Powered by
                      </span>
                      <span className="text-xs font-bold text-indigo-600 group-hover:text-indigo-700">
                        Golicit Services Pvt. Ltd.
                      </span>
                    </div>
                  </a>
                </div>
              </div>

              {/* Footer */}
              <div className="text-center">
                <p className="text-xs text-gray-400">
                  © 2025 THERA-CURE • All rights reserved
                </p>
              </div>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
