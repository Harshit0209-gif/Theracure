"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";

export type UserRole =
  | "receptionist"
  | "content-manager"
  | "admin"
  | "therapist";

interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string, role: UserRole) => Promise<void>;
  logout: () => void;
  getRoleBasedRoute: (role: UserRole) => string;
  setUser: (user: User | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const syncUser = () => {
      const storedUser = localStorage.getItem("user");
      setUser(storedUser ? JSON.parse(storedUser) : null);
    };

    window.addEventListener("storage", syncUser);

    return () => {
      window.removeEventListener("storage", syncUser);
    };
  }, []);

  // Get role-based route
  const getRoleBasedRoute = (role: UserRole): string => {
    switch (role) {
      case "receptionist":
        return "/receptionist";
      case "content-manager":
        return "/content";
      case "admin":
        return "/admin";
      case "therapist":
        return "/therapist";
      default:
        return "/login";
    }
  };

  // Check if user is already logged in on mount
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string, role: UserRole) => {
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

      // Create user object from API response
      const newUser: User = {
        id: data.id,
        name: data.name,
        email: data.email,
        role: data.role,
        avatar: "/placeholder.svg?height=40&width=40", // Default avatar
      };

      // Save user to state and localStorage
      setUser(newUser);
      localStorage.setItem("user", JSON.stringify(newUser));

      // Redirect based on role using the centralized function
      router.push(getRoleBasedRoute(role));
    } catch (error) {
      console.error("Login failed:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("user");
    router.push("/login");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        logout,
        getRoleBasedRoute,
        setUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
