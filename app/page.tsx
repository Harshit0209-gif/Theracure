"use client"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { StatsSection } from "@/components/stats/stats-section"
import { AppointmentsSection } from "@/components/appointments/appointments-section"
import { InvoicesSection } from "@/components/invoices/invoices-section"
import { PatientManagementSection } from "@/components/patient/patient-management-section"
import { useAuth } from "@/contexts/auth-context"

export default function Dashboard() {
  const { user } = useAuth()

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl font-semibold text-gray-800 mb-6">Good Morning, {user?.name || "User"}</h1>

          {/* Stats Section */}
          <StatsSection />

          {/* Appointments Section */}
          <AppointmentsSection />

          {/* Invoices Section */}
          <InvoicesSection />

          {/* Patient Management Section */}
          <PatientManagementSection />
        </div>
      </div>
    </DashboardLayout>
  )
}
