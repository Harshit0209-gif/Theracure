"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useApiFetch } from "@/hooks/use-api-fetch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RefreshCw, Clock, User, Shield } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

export function SessionStatus() {
  const { user } = useAuth();
  const { apiFetch } = useApiFetch();
  const [sessionInfo, setSessionInfo] = useState<{
    timeUntilExpiry: number;
    lastActivity: string;
  } | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const checkSessionStatus = async () => {
    try {
      const response = await apiFetch("/api/auth/refresh", {
        method: "POST",
        skipAuth: false,
        retryOnAuthError: false,
      });

      if (response.success) {
        toast({
          title: "Session Refreshed",
          description: "Your session has been refreshed successfully.",
        });
      }
    } catch (error) {
      console.error("Session status check failed:", error);
    }
  };

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    try {
      await checkSessionStatus();
    } finally {
      setIsRefreshing(false);
    }
  };

  // Update session info periodically
  useEffect(() => {
    const updateSessionInfo = () => {
      // This would be populated by actual session data
      // For now, we'll simulate it
      setSessionInfo({
        timeUntilExpiry: 45, // minutes
        lastActivity: new Date().toLocaleTimeString(),
      });
    };

    updateSessionInfo();
    const interval = setInterval(updateSessionInfo, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  if (!user) return null;

  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Shield className="h-4 w-4" />
          Session Status
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-gray-500" />
            <span className="text-sm text-gray-600">User</span>
          </div>
          <Badge variant="secondary" className="text-xs">
            {user.role}
          </Badge>
        </div>

        {sessionInfo && (
          <>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-600">Expires in</span>
              </div>
              <Badge
                variant={
                  sessionInfo.timeUntilExpiry < 10 ? "destructive" : "secondary"
                }
                className="text-xs"
              >
                {sessionInfo.timeUntilExpiry}m
              </Badge>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Last Activity</span>
              <span className="text-xs text-gray-500">
                {sessionInfo.lastActivity}
              </span>
            </div>
          </>
        )}

        <Button
          onClick={handleManualRefresh}
          disabled={isRefreshing}
          size="sm"
          className="w-full"
          variant="outline"
        >
          <RefreshCw
            className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`}
          />
          {isRefreshing ? "Refreshing..." : "Refresh Session"}
        </Button>
      </CardContent>
    </Card>
  );
}
