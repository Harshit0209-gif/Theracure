"use client";

import { useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";
import { toast } from "@/components/ui/use-toast";
import { SessionManagerConfig } from "@/types/session";

export function useSessionManager(config: Partial<SessionManagerConfig> = {}) {
  const {
    refreshThreshold = 20, // 20 minutes before expiry
    inactivityTimeout = Number(process.env.NEXT_PUBLIC_INACTIVITY_TIMEOUT) ||
      60,
    checkInterval = 5, // Check every 5 minutes
  } = config;

  const { user, logout } = useAuth();
  const router = useRouter();
  const lastActivityRef = useRef<number>(Date.now());
  const sessionCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const inactivityTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const warningTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Update last activity timestamp
  const updateActivity = useCallback(() => {
    lastActivityRef.current = Date.now();
  }, []);

  // Check and refresh session
  const checkAndRefreshSession = useCallback(async () => {
    if (!user) return;

    try {
      const response = await fetch("/api/auth/refresh", {
        method: "POST",
        credentials: "include",
      });

      const data = await response.json();

      if (!response.ok && response.status === 401) {
        // Session expired or invalid
        console.log("Session expired, logging out");
        toast({
          title: "Session Expired",
          description: "Your session has expired. Please log in again.",
          variant: "destructive",
        });
        logout();
        router.push("/login");
      }
    } catch (error) {
      console.error("Session refresh failed:", error);
      // Don't logout on network errors, just log the error
    }
  }, [user, logout, router]);

  // Handle inactivity timeout
  const handleInactivityTimeout = useCallback(() => {
    toast({
      title: "Session Timeout",
      description: "You have been logged out due to inactivity.",
      variant: "destructive",
    });
    logout();
    router.push("/login");
  }, [logout, router]);

  // Reset inactivity timer
  const resetInactivityTimer = useCallback(() => {
    // Clear existing timeout
    if (inactivityTimeoutRef.current) {
      clearTimeout(inactivityTimeoutRef.current);
    }

    // Clear existing warning timeout
    if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current);
    warningTimeoutRef.current = setTimeout(
      () => {
        toast({
          title: "Session Expiring Soon",
          description: "You will be logged out in 5 minutes due to inactivity.",
          variant: "default",
        });
      },
      (inactivityTimeout - 5) * 60 * 1000,
    );

    // Set new timeout
    inactivityTimeoutRef.current = setTimeout(
      handleInactivityTimeout,
      inactivityTimeout * 60 * 1000,
    );
  }, [handleInactivityTimeout, inactivityTimeout]);

  // Start session management
  const startSessionManagement = useCallback(() => {
    if (!user) return;

    // Clear any existing intervals
    if (sessionCheckIntervalRef.current) {
      clearInterval(sessionCheckIntervalRef.current);
    }

    // Start periodic session checks
    sessionCheckIntervalRef.current = setInterval(
      checkAndRefreshSession,
      checkInterval * 60 * 1000,
    );

    // Start inactivity timer
    resetInactivityTimer();

    // Initial session check
    checkAndRefreshSession();
  }, [user, checkAndRefreshSession, resetInactivityTimer, checkInterval]);

  // Stop session management
  const stopSessionManagement = useCallback(() => {
    if (sessionCheckIntervalRef.current) {
      clearInterval(sessionCheckIntervalRef.current);
      sessionCheckIntervalRef.current = null;
    }

    if (inactivityTimeoutRef.current) {
      clearTimeout(inactivityTimeoutRef.current);
      inactivityTimeoutRef.current = null;
    }

    if (warningTimeoutRef.current) {
      clearTimeout(warningTimeoutRef.current);
      warningTimeoutRef.current = null;
    }
  }, []);

  // Set up activity listeners
  useEffect(() => {
    if (!user) {
      stopSessionManagement();
      return;
    }

    // Start session management when user is logged in
    startSessionManagement();

    // Activity event listeners
    const activityEvents = [
      "mousedown",
      "mousemove",
      "keypress",
      "scroll",
      "touchstart",
      "click",
    ];

    const handleActivity = () => {
      updateActivity();
      resetInactivityTimer();
    };

    // Add event listeners
    activityEvents.forEach((event) => {
      document.addEventListener(event, handleActivity, true);
    });

    // Cleanup function
    return () => {
      stopSessionManagement();
      activityEvents.forEach((event) => {
        document.removeEventListener(event, handleActivity, true);
      });
    };
  }, [
    user,
    startSessionManagement,
    stopSessionManagement,
    updateActivity,
    resetInactivityTimer,
  ]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopSessionManagement();
    };
  }, [stopSessionManagement]);

  return {
    updateActivity,
    checkAndRefreshSession,
    resetInactivityTimer,
    lastActivity: lastActivityRef.current,
  };
}
