"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { useRouter } from "next/navigation"

export type UserRole = "receptionist" | "content-manager" | "admin"

interface User {
  id: string
  name: string
  email: string
  role: UserRole
  avatar?: string
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  login: (email: string, password: string, role: UserRole) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  // Check if user is already logged in on mount
  useEffect(() => {
    const storedUser = localStorage.getItem("user")
    if (storedUser) {
      setUser(JSON.parse(storedUser))
    }
    setIsLoading(false)
  }, [])

  const login = async (email: string, password: string, role: UserRole) => {
    setIsLoading(true)
    try {
      // In a real app, this would be an API call to validate credentials
      // For demo purposes, we'll simulate a successful login with any credentials

      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Create a mock user based on the provided role
      const newUser: User = {
        id: Math.random().toString(36).substring(2, 9),
        name: role === "receptionist" ? "John Doe" : "Jane Smith",
        email,
        role,
        avatar: "/placeholder.svg?height=40&width=40",
      }

      // Save user to state and localStorage
      setUser(newUser)
      localStorage.setItem("user", JSON.stringify(newUser))

      // Redirect based on role
      if (role === "receptionist") {
        router.push("/receptionist")
      } else if (role === "content-manager") {
        router.push("/content")
      } else if (role === "admin") {
        router.push("/admin")
      }
    } catch (error) {
      console.error("Login failed:", error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem("user")
    router.push("/login")
  } 

  return <AuthContext.Provider value={{ user, isLoading, login, logout }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
