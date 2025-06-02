"use client";

import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { PrescriptionManagementSection } from "@/components/prescription-management-section";

export default function Clients() {
  return (
    <DashboardLayout>
      <PrescriptionManagementSection />
    </DashboardLayout>
  );
}
