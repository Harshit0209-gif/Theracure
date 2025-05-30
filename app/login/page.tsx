"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth, type UserRole } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, Eye, EyeOff } from "lucide-react"
import { toast } from "@/components/ui/use-toast"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [role, setRole] = useState<UserRole>("receptionist")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const { login } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password, role }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to login")
      }

      // Call the login function from auth context
      await login(email, password, role)
      
      toast({
        title: "Login successful",
        description: "Welcome back!",
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid credentials. Please try again.")
      toast({
        title: "Login failed",
        description: err instanceof Error ? err.message : "Invalid credentials. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-indigo-800 to-indigo-900 p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-xl">
          <CardHeader className="space-y-1 text-center">
            <div className="flex justify-center mb-4">
              <div className="h-12 w-12 rounded-full bg-indigo-700 flex items-center justify-center">
                <span className="text-white font-bold text-lg">TC</span>
              </div>
            </div>
            <CardTitle className="text-2xl font-bold">THERA-CURE</CardTitle>
            <CardDescription>Advanced Physiotherapy Clinic Dashboard</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="demo">Demo Access</TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <form onSubmit={handleSubmit} className="space-y-4">
                  {error && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="name@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="pr-10 focus:ring-2 focus:ring-indigo-500"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4 text-gray-500" />
                        ) : (
                          <Eye className="h-4 w-4 text-gray-500" />
                        )}
                        <span className="sr-only">
                          {showPassword ? "Hide password" : "Show password"}
                        </span>
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Select Role</Label>
                    <RadioGroup
                      value={role}
                      onValueChange={(value) => setRole(value as UserRole)}
                      className="flex flex-col space-y-1"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="receptionist" id="receptionist" />
                        <Label htmlFor="receptionist" className="cursor-pointer">
                          Receptionist
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="content-manager" id="content-manager" />
                        <Label htmlFor="content-manager" className="cursor-pointer">
                          Content Manager
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="admin" id="admin" />
                        <Label htmlFor="admin" className="cursor-pointer">
                          Administrator
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="therapist" id="therapist" />
                        <Label htmlFor="therapist" className="cursor-pointer">
                          Therapist
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full bg-indigo-700 hover:bg-indigo-800 transition-colors" 
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <div className="flex items-center gap-2">
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        Logging in...
                      </div>
                    ) : (
                      "Login"
                    )}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="demo">
                <div className="space-y-4">
                  <p className="text-sm text-gray-500">
                    For demonstration purposes, you can access the dashboard with these pre-configured roles:
                  </p>

                  <div className="space-y-3">
                    <Button
                      className="w-full bg-indigo-700 hover:bg-indigo-800 transition-colors"
                      onClick={async () => {
                        try {
                          await login("receptionist@example.com", "password123", "receptionist")
                        } catch (error) {
                          toast({
                            title: "Login failed",
                            description: error instanceof Error ? error.message : "Invalid credentials",
                            variant: "destructive",
                          })
                        }
                      }}
                      disabled={isLoading}
                    >
                      Login as Receptionist
                    </Button>

                    <Button
                      className="w-full bg-indigo-700 hover:bg-indigo-800 transition-colors"
                      onClick={async () => {
                        try {
                          await login("content@example.com", "password123", "content-manager")
                        } catch (error) {
                          toast({
                            title: "Login failed",
                            description: error instanceof Error ? error.message : "Invalid credentials",
                            variant: "destructive",
                          })
                        }
                      }}
                      disabled={isLoading}
                    >
                      Login as Content Manager
                    </Button>

                    <Button
                      className="w-full bg-indigo-700 hover:bg-indigo-800 transition-colors"
                      onClick={async () => {
                        try {
                          await login("admin@example.com", "password123", "admin")
                        } catch (error) {
                          toast({
                            title: "Login failed",
                            description: error instanceof Error ? error.message : "Invalid credentials",
                            variant: "destructive",
                          })
                        }
                      }}
                      disabled={isLoading}
                    >
                      Login as Administrator
                    </Button>

                    <Button
                      className="w-full bg-indigo-700 hover:bg-indigo-800 transition-colors"
                      onClick={async () => {
                        try {
                          await login("therapist@example.com", "password123", "therapist")
                        } catch (error) {
                          toast({
                            title: "Login failed",
                            description: error instanceof Error ? error.message : "Invalid credentials",
                            variant: "destructive",
                          })
                        }
                      }}
                      disabled={isLoading}
                    >
                      Login as Therapist
                    </Button>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
          <CardFooter className="flex flex-col">
            <p className="text-xs text-center text-gray-500 mt-4">
              © 2024 THERA-CURE Advanced Physiotherapy Clinic. All rights reserved.
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
