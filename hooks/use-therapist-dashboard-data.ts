import { useState, useEffect, useCallback } from "react";
import useSWR from "swr";
import { useAuth } from "@/contexts/auth-context";
import { TodayAppointment } from "@/types/appointments";

interface TherapistStats {
  assignedPatients: number;
  todayAppointments: number;
  completedSessions: number;
  pendingSessions: number;
  thisWeekSessions: number;
  thisMonthSessions: number;
}

interface AssignedPatient {
  id: string;
  patientId: string;
  patientName: string;
  age: number;
  condition: string;
  lastVisit: string | null;
  nextAppointment: string | null;
  status: "confirmed" | "completed" | "cancelled";
  assignmentId: string;
}

const fetcher = async (url: string) => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  const data = await response.json();
  if (!data.success) {
    throw new Error(data.error || "API request failed");
  }
  return data.data;
};

export const useTherapistDashboardData = () => {
  const { user } = useAuth();
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const {
    data: stats,
    error: statsError,
    isLoading: statsLoading,
    mutate: mutateStats,
  } = useSWR<TherapistStats>(
    user?.id ? `/api/therapists/${user.id}/stats` : null,
    fetcher,
    {
      refreshInterval: 60000,
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      onSuccess: () => setLastUpdated(new Date()),
    },
  );

  const {
    data: assignedPatients,
    error: patientsError,
    isLoading: patientsLoading,
    mutate: mutatePatients,
  } = useSWR<AssignedPatient[]>(
    user?.id ? `/api/therapists/${user.id}/patients` : null,
    fetcher,
    {
      refreshInterval: 120000,
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      onSuccess: () => setLastUpdated(new Date()),
    },
  );

  const {
    data: todayAppointments,
    error: todayError,
    isLoading: todayLoading,
    mutate: mutateToday,
  } = useSWR<TodayAppointment[]>(
    user?.id ? "/api/appointments/today" : null,
    fetcher,
    {
      refreshInterval: 30000,
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      onSuccess: () => setLastUpdated(new Date()),
    },
  );

  const refreshAll = useCallback(async () => {
    if (user?.id) {
      await Promise.all([mutateStats(), mutatePatients(), mutateToday()]);
      setLastUpdated(new Date());
    }
  }, [user?.id, mutateStats, mutatePatients, mutateToday]);

  useEffect(() => {
    if (!lastUpdated && (stats || assignedPatients || todayAppointments)) {
      setLastUpdated(new Date());
    }
  }, [stats, assignedPatients, todayAppointments, lastUpdated]);

  return {
    stats,
    assignedPatients,
    todayAppointments,

    isLoading: {
      stats: statsLoading,
      patients: patientsLoading,
      today: todayLoading,
      refreshing: statsLoading || patientsLoading || todayLoading,
    },

    error: {
      stats: !!statsError,
      patients: !!patientsError,
      today: !!todayError,
    },

    lastUpdated,
    refreshAll,
  };
};
