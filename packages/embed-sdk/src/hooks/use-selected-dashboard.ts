import type { SelectedDashboard } from "../../../../contracts/src/embed-viewer";

export async function getSelectedDashboard(_: { appId: string }) {
  return {
    dashboardId: null
  } as SelectedDashboard;
}

export async function setSelectedDashboard(input: {
  appId: string;
  dashboardId: string;
}) {
  return {
    dashboardId: input.dashboardId
  } as SelectedDashboard;
}
