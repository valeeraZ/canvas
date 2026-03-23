import { DashboardList } from "@/components/portal/dashboard-list";
import { getPortalDemoStore } from "@/lib/portal/demo-store";

export default function PortalDashboardsPage() {
  const store = getPortalDemoStore();

  return (
    <DashboardList
      dashboards={store.dashboards}
      selectedDashboardId={store.selectedDashboardId}
    />
  );
}
