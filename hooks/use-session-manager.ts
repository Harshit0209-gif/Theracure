"use client";

import { useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";
import { toast } from "@/components/ui/use-toast";
import { SessionManagerConfig } from "@/types/session";

const ACTIVITY_EVENTS = [
  "mousedown",
  "mousemove",
  "keypress",
  "scroll",
  "touchstart",
  "click",
] as const;

export function useSessionManager(config: Partial<SessionManagerConfig> = {}) {
  const {
    inactivityTimeout = Number(process.env.NEXT_PUBLIC_INACTIVITY_TIMEOUT) ||
      120,
    checkInterval = 5,
  } = config;

  const { user, logout } = useAuth();
  const router = useRouter();

  const sessionCheckRef = useRef<NodeJS.Timeout | null>(null);
  const inactivityRef = useRef<NodeJS.Timeout | null>(null);
  const warningRef = useRef<NodeJS.Timeout | null>(null);

  const clearAllTimers = useCallback(() => {
    if (sessionCheckRef.current) clearInterval(sessionCheckRef.current);
    if (inactivityRef.current) clearTimeout(inactivityRef.current);
    if (warningRef.current) clearTimeout(warningRef.current);
    sessionCheckRef.current = null;
    inactivityRef.current = null;
    warningRef.current = null;
  }, []);

  const doLogout = useCallback(
    (reason: "expired" | "inactive") => {
      clearAllTimers();
      toast({
        title: reason === "expired" ? "Session Expired" : "Session Timeout",
        description:
          reason === "expired"
            ? "Your session has expired. Please log in again."
            : "You have been logged out due to inactivity.",
        variant: "destructive",
      });
      logout();
      router.push("/login");
    },
    [clearAllTimers, logout, router],
  );

  const refreshSession = useCallback(async () => {
    if (!user) return;
    try {
      const res = await fetch("/api/auth/refresh", {
        method: "POST",
        credentials: "include",
      });
      if (res.status === 400) return;
      if (res.status === 401) doLogout("expired");
    } catch {
      console.error("Error refreshing session token");
    }
  }, [user, doLogout]);

  const resetInactivityTimer = useCallback(() => {
    if (inactivityRef.current) clearTimeout(inactivityRef.current);
    if (warningRef.current) clearTimeout(warningRef.current);

    if (inactivityTimeout > 5) {
      warningRef.current = setTimeout(
        () => {
          toast({
            title: "Session Expiring Soon",
            description:
              "You will be logged out in 5 minutes due to inactivity.",
          });
        },
        (inactivityTimeout - 5) * 60 * 1000,
      );
    }

    inactivityRef.current = setTimeout(
      () => doLogout("inactive"),
      inactivityTimeout * 60 * 1000,
    );
  }, [doLogout, inactivityTimeout]);

  useEffect(() => {
    if (!user) {
      clearAllTimers();
      return;
    }

    sessionCheckRef.current = setInterval(
      refreshSession,
      checkInterval * 60 * 1000,
    );
    resetInactivityTimer();

    refreshSession();

    const handleActivity = () => resetInactivityTimer();
    ACTIVITY_EVENTS.forEach((e) =>
      document.addEventListener(e, handleActivity, true),
    );

    return () => {
      clearAllTimers();
      ACTIVITY_EVENTS.forEach((e) =>
        document.removeEventListener(e, handleActivity, true),
      );
    };
  }, [
    user,
    refreshSession,
    resetInactivityTimer,
    clearAllTimers,
    checkInterval,
  ]);

  return { resetInactivityTimer };
}
