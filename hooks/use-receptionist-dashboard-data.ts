import { useState, useEffect, useCallback } from "react";
import useSWR from "swr";

interface TodayAppointment {
  id: string;
  patientName: string;
  therapistName: string;
  startTime: string;
  endTime: string;
  status: "scheduled" | "confirmed" | "in-progress" | "completed" | "cancelled";
  patientId: string;
  therapistId: string;
  appointmentDuration: number;
}

interface ReceptionistStats {
  totalPatients: {
    count: number;
    growthPercentage: number;
    isGrowthPositive: boolean;
  };
  todayConsultations: {
    total: number;
    newThisWeek: number;
  };
  todaySessions: {
    total: number;
    pending: number;
  };
  pendingPayments: {
    amount: number;
    invoiceCount: number;
  };
  todayAppointments: number;
  completedToday: number;
  pendingToday: number;
  cancelledToday: number;
  totalPatientsToday: number;
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

export const useReceptionistDashboardData = () => {
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // SWR hooks for receptionist-specific data
  const {
    data: todayAppointments,
    error: appointmentsError,
    isLoading: appointmentsLoading,
    mutate: mutateAppointments,
  } = useSWR<TodayAppointment[]>("/api/appointments/today", fetcher, {
    refreshInterval: 30000, // 30 seconds for real-time updates
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
    onSuccess: () => setLastUpdated(new Date()),
  });

  const {
    data: receptionistStats,
    error: statsError,
    isLoading: statsLoading,
    mutate: mutateStats,
  } = useSWR<ReceptionistStats>("/api/receptionist/stats", fetcher, {
    refreshInterval: 60000, // 1 minute
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
    onSuccess: () => setLastUpdated(new Date()),
  });

  // Manual refresh function
  const refreshAll = useCallback(async () => {
    await Promise.all([mutateAppointments(), mutateStats()]);
    setLastUpdated(new Date());
  }, [mutateAppointments, mutateStats]);

  // Set initial last updated time
  useEffect(() => {
    if (!lastUpdated && (todayAppointments || receptionistStats)) {
      setLastUpdated(new Date());
    }
  }, [todayAppointments, receptionistStats, lastUpdated]);

  return {
    todayAppointments,
    receptionistStats,

    isLoading: {
      appointments: appointmentsLoading,
      stats: statsLoading,
      refreshing: appointmentsLoading || statsLoading,
    },

    error: {
      appointments: !!appointmentsError,
      stats: !!statsError,
    },

    lastUpdated,
    refreshAll,
  };
};
