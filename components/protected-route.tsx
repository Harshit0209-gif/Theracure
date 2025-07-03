"use client";

import type React from "react";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (pathname === "/" || pathname === "/login") {
      if (!user) {
        router.push("/login");
      } else {
        switch (user.role) {
          case "content-manager":
            router.push("/content");
            break;
          case "receptionist":
            router.push("/receptionist");
            break;
          case "admin":
            router.push("/admin");
            break;
          case "therapist":
            router.push("/therapist");
            break;
        }
      }
      return;
    }

    // Handle other routes
    if (!isLoading && !user && pathname !== "/login") {
      router.push("/login");
    }

    // Define allowed routes for each role
    const allowedRoutes = {
      "content-manager": [
        "/content",
        "/blogs",
        "/announcement",
        "/profile",
        "/support",
      ],
      receptionist: [
        "/receptionist",
        "/appointments",
        "/patients",
        "/invoices",
        "/profile",
        "/support",
      ],
      admin: [
        "/admin",

        "/appointments",
        "/patients",
        "/invoices",
        "/blogs",
        "/announcement",
        "/employees",
        "/consultation",
        "/analytics",
        "/services",
        "/prescriptions",
        "/profile",
        "/support",
      ],
      therapist: [
        "/therapist",
        "/patients",
        "/prescriptions",
        "/appointments",
        "/profile",
        "support",
      ],
    };

    if (user?.role) {
      const userAllowedRoutes =
        allowedRoutes[user.role as keyof typeof allowedRoutes];
      const hasAccess = userAllowedRoutes.some((route) =>
        pathname.startsWith(route)
      );

      if (!hasAccess && pathname !== "/login") {
        router.push(userAllowedRoutes[0]);
      }
    }
  }, [user, isLoading, router, pathname]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        Loading...
      </div>
    );
  }

  // If on login page or authenticated, show children
  if (pathname === "/login" || user) {
    return <>{children}</>;
  }

  // Otherwise show nothing while redirecting
  return null;
}
