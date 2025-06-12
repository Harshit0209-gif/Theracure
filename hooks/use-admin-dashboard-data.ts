import { useState, useEffect, useCallback } from "react";
import useSWR from "swr";

interface PatientStats {
  totalPatients: {
    count: number;
    thisMonth: number;
    lastMonth: number;
    growthPercentage: number;
    isGrowthPositive: boolean;
  };
  activePatients: {
    count: number;
    withActiveAssignments: number;
    description: string;
  };
  pendingFollowUps: {
    count: number;
    period: string;
    nextWeekStart: string;
    nextWeekEnd: string;
  };
  recentActivity: {
    recentRegistrations: number;
    description: string;
  };
  meta: {
    generatedAt: string;
  };
}

interface TherapyStats {
  todaySessions: {
    total: number;
    completed: number;
    pending: number;
    inProgress: number;
    cancelled: number;
  };
  todayConsultations: {
    total: number;
    scheduled: number;
    completed: number;
    pending: number;
  };
  therapistStatus: {
    total: number;
    active: number;
    onBreak: number;
    offDuty: number;
  };
}

interface Revenue {
  thisMonth: number;
  lastMonth: number;
  growthPercentage: number;
  isGrowthPositive: boolean;
}

interface TodayAppointment {
  id: string;
  patientName: string;
  therapistName: string;
  time: string;
  status: "confirmed" | "pending" | "in-progress" | "completed" | "cancelled";
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

export const useAdminDashboardData = () => {
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // SWR hooks for different data sources
  const {
    data: patientStats,
    error: patientError,
    isLoading: patientLoading,
    mutate: mutatePatients,
  } = useSWR<PatientStats>("/api/patients/stats", fetcher, {
    refreshInterval: 60000, // 1 minute
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
    onSuccess: () => setLastUpdated(new Date()),
  });

  const {
    data: therapyStats,
    error: therapyError,
    isLoading: therapyLoading,
    mutate: mutateTherapy,
  } = useSWR<TherapyStats>("/api/therapy/stats", fetcher, {
    refreshInterval: 30000,
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
    onSuccess: () => setLastUpdated(new Date()),
  });

  const {
    data: todayAppointments,
    error: appointmentsError,
    isLoading: appointmentsLoading,
    mutate: mutateAppointments,
  } = useSWR<TodayAppointment[]>("/api/appointments/today", fetcher, {
    refreshInterval: 15000, // 15 seconds
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
    onSuccess: () => setLastUpdated(new Date()),
  });

  // Mock revenue data (replace with real API)
  const revenue: Revenue = {
    thisMonth: 245000,
    lastMonth: 226850,
    growthPercentage: 8.0,
    isGrowthPositive: true,
  };

  // Manual refresh function
  const refreshAll = useCallback(async () => {
    await Promise.all([
      mutatePatients(),
      mutateTherapy(),
      mutateAppointments(),
    ]);
    setLastUpdated(new Date());
  }, [mutatePatients, mutateTherapy, mutateAppointments]);

  // Set initial last updated time
  useEffect(() => {
    if (!lastUpdated && (patientStats || therapyStats || todayAppointments)) {
      setLastUpdated(new Date());
    }
  }, [patientStats, therapyStats, todayAppointments, lastUpdated]);

  return {
    // Data
    patientStats,
    therapyStats,
    todayAppointments,
    revenue,

    // Loading states
    isLoading: {
      patients: patientLoading,
      therapy: therapyLoading,
      appointments: appointmentsLoading,
      revenue: false, // Mock data, so never loading
      refreshing: patientLoading || therapyLoading || appointmentsLoading,
    },

    // Error states
    error: {
      patients: !!patientError,
      therapy: !!therapyError,
      appointments: !!appointmentsError,
      revenue: false, // Mock data, so never error
    },

    // Meta
    lastUpdated,
    refreshAll,
  };
};
