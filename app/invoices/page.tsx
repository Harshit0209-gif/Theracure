"use client";
import React from "react";
import { InvoicesSection } from "@/components/invoices/invoices-section";
import { DashboardLayout } from "@/components/layout/dashboard-layout";

export default function Invoice() {
  return (
    <DashboardLayout>
      <InvoicesSection />
    </DashboardLayout>
  );
}
