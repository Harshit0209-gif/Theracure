"use client";

import type React from "react";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { RoleAllowedRoutes, RoleRoutes } from "@/lib/userRoles";

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
        const defaultRoute = RoleRoutes[user.role] ?? "/login";
        router.push(defaultRoute);
      }
      return;
    }

    if (!isLoading && !user && pathname !== "/login") {
      router.push("/login");
    }

    if (user?.role) {
      const allowedRoutes = RoleAllowedRoutes[user.role];
      const hasAccess = allowedRoutes.some((route) =>
        pathname.startsWith(route)
      );

      if (!hasAccess && pathname !== "/login") {
        router.push(allowedRoutes[0]);
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

  if (pathname === "/login" || user) {
    return <>{children}</>;
  }

  return null;
}
