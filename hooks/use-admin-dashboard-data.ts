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

interface RevenueStatus {
  totalInvoices: number;
  paidInvoices: number;
  dueInvoices: number;
  totalRevenue: number;
  totalPaid: number;
  totalDue: number;

  revenue: {
    thisMonth: number;
    lastMonth: number;
    growthPercentage: number;
    isGrowthPositive: boolean;
  };
  paidRevenue: {
    thisMonth: number;
    lastMonth: number;
    growthPercentage: number;
    isGrowthPositive: boolean;
  };
  dueAmount: {
    thisMonth: number;
    lastMonth: number;
    growthPercentage: number;
    isGrowthPositive: boolean;
  };
  period: {
    start: string;
    end: string;
    previousStart: string;
    previousEnd: string;
  };
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

  const {
    data: patientStats,
    error: patientError,
    isLoading: patientLoading,
    mutate: mutatePatients,
  } = useSWR<PatientStats>("/api/patients/stats", fetcher, {
    refreshInterval: 60000,
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
    refreshInterval: 15000,
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
    onSuccess: () => setLastUpdated(new Date()),
  });

  const {
    data: revenueStatus,
    error: revenueError,
    isLoading: revenueLoading,
    mutate: mutateRevenue,
  } = useSWR<RevenueStatus>("/api/invoices/stats", fetcher, {
    refreshInterval: 30000,
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
    onSuccess: () => setLastUpdated(new Date()),
  });

  const refreshAll = useCallback(async () => {
    await Promise.all([
      mutatePatients(),
      mutateTherapy(),
      mutateAppointments(),
      mutateRevenue(),
    ]);
    setLastUpdated(new Date());
  }, [mutatePatients, mutateTherapy, mutateAppointments, mutateRevenue]);

  useEffect(() => {
    if (!lastUpdated && (patientStats || therapyStats || todayAppointments)) {
      setLastUpdated(new Date());
    }
  }, [patientStats, therapyStats, todayAppointments, lastUpdated]);

  return {
    patientStats,
    therapyStats,
    todayAppointments,
    revenueStatus,

    isLoading: {
      patients: patientLoading,
      therapy: therapyLoading,
      appointments: appointmentsLoading,
      revenue: revenueLoading,
      refreshing: patientLoading || therapyLoading || appointmentsLoading,
    },

    error: {
      patients: !!patientError,
      therapy: !!therapyError,
      appointments: !!appointmentsError,
      revenue: !!revenueError,
    },

    lastUpdated,
    refreshAll,
  };
};
