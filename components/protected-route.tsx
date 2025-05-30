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
		if (pathname === "/") {
			if (!user) {
				router.push("/login");
			} else {
				// Redirect to role-specific dashboard
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
			"content-manager": ["/content", "/blogs", "/announcement"],
			receptionist: [
				"/receptionist",
				"/appointments",
				"/patients",
				"/invoices",
				"/consultations",
			],
			admin: [
				"/admin",
				"/settings",
				"/appointments",
				"/patients",
				"/invoices",
				"/blogs",
				"/announcement",
				"/employees",
				"/consultations",
			],
			therapist: ["/therapist", "/patients", "/prescriptions"],
		};

		// Check if user's role has access to current path
		if (user?.role) {
			const userAllowedRoutes =
				allowedRoutes[user.role as keyof typeof allowedRoutes];
			const hasAccess = userAllowedRoutes.some((route) =>
				pathname.startsWith(route)
			);

			if (!hasAccess && pathname !== "/login") {
				// Redirect to first allowed route for their role
				router.push(userAllowedRoutes[0]);
			}
		}
	}, [user, isLoading, router, pathname]);

	// Show nothing while checking authentication
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
