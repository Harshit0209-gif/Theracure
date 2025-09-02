"use client";

import { useCallback } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";
import { toast } from "@/components/ui/use-toast";

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
  message?: string;
}

interface FetchOptions extends RequestInit {
  skipAuth?: boolean;
  retryOnAuthError?: boolean;
  maxRetries?: number;
}

export function useApiFetch() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const apiFetch = useCallback(
    async <T = any>(
      url: string,
      options: FetchOptions = {}
    ): Promise<ApiResponse<T>> => {
      const {
        skipAuth = false,
        retryOnAuthError = true,
        maxRetries = 1,
        ...fetchOptions
      } = options;

      let retryCount = 0;

      const attemptFetch = async (): Promise<ApiResponse<T>> => {
        try {
          // Add default headers
          const headers = {
            "Content-Type": "application/json",
            ...fetchOptions.headers,
          };

          const response = await fetch(url, {
            ...fetchOptions,
            headers,
            credentials: "include", // Always include cookies
          });

          const data = await response.json();

          // Handle authentication errors
          if (response.status === 401) {
            const errorCode = data.code;

            if (errorCode === "SESSION_EXPIRED") {
              // Session expired, logout user
              toast({
                title: "Session Expired",
                description: "Your session has expired. Please log in again.",
                variant: "destructive",
              });
              logout();
              router.push("/login");
              return { success: false, error: "Session expired" };
            }

            if (
              errorCode === "SESSION_EXPIRING" ||
              errorCode === "TOKEN_EXPIRING"
            ) {
              // Session is expiring soon, try to refresh
              if (retryOnAuthError && retryCount < maxRetries) {
                retryCount++;
                console.log(
                  `Attempting to refresh session (attempt ${retryCount})`
                );

                try {
                  const refreshResponse = await fetch("/api/auth/refresh", {
                    method: "POST",
                    credentials: "include",
                  });

                  if (refreshResponse.ok) {
                    console.log("Session refreshed, retrying original request");
                    // Retry the original request
                    return await attemptFetch();
                  } else {
                    // Refresh failed, logout user
                    toast({
                      title: "Session Refresh Failed",
                      description:
                        "Unable to refresh your session. Please log in again.",
                      variant: "destructive",
                    });
                    logout();
                    router.push("/login");
                    return { success: false, error: "Session refresh failed" };
                  }
                } catch (refreshError) {
                  console.error("Session refresh error:", refreshError);
                  logout();
                  router.push("/login");
                  return { success: false, error: "Session refresh failed" };
                }
              } else {
                // Max retries reached or retry disabled
                toast({
                  title: "Session Error",
                  description:
                    "Your session is expiring. Please refresh the page.",
                  variant: "destructive",
                });
                return { success: false, error: "Session expiring" };
              }
            }

            // Other authentication errors
            return {
              success: false,
              error: data.message || "Authentication failed",
            };
          }

          // Handle other errors
          if (!response.ok) {
            return {
              success: false,
              error: data.message || `HTTP ${response.status}`,
              code: data.code,
            };
          }

          // Success response
          return {
            success: true,
            data: data,
          };
        } catch (error) {
          console.error("API fetch error:", error);
          return {
            success: false,
            error: error instanceof Error ? error.message : "Network error",
          };
        }
      };

      return await attemptFetch();
    },
    [user, logout, router]
  );

  return { apiFetch };
}
