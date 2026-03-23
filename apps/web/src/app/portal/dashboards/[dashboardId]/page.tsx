import { DashboardEditor } from "@/components/portal/dashboard-editor";
import { getPortalDemoStore } from "@/lib/portal/demo-store";

export default async function PortalDashboardDetailPage(props: {
  params: Promise<{
    dashboardId: string;
  }>;
}) {
  const { dashboardId } = await props.params;
  const store = getPortalDemoStore();
  const dashboard =
    store.dashboards.find((item) => item.id === dashboardId) ?? store.dashboards[0];

  return (
    <DashboardEditor
      dashboard={dashboard}
      selectedDashboardId={store.selectedDashboardId}
      shareSubjects={store.shareRules[dashboard.id] ?? []}
    />
  );
}
