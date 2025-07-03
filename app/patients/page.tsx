"use client";

import { PatientManagementSection } from "@/components/patient/patient-management-section";
import { DashboardLayout } from "@/components/layout/dashboard-layout";

export default function Patient() {
  return (
    <DashboardLayout>
      <PatientManagementSection />
    </DashboardLayout>
  );
}
