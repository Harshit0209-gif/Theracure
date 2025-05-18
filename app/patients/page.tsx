import { ClientManagementSection } from "@/components/clients/client-management-section";
import { DashboardLayout } from "@/components/layout/dashboard-layout";

export default function Clients() {
    return (
        <DashboardLayout>
          <ClientManagementSection />
        </DashboardLayout>
    )
}