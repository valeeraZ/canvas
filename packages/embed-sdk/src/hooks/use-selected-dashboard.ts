import type { SelectedDashboard } from "../../../../contracts/src/embed-viewer";
import {
  getSelectedDashboard as fetchSelectedDashboard,
  setSelectedDashboard as updateSelectedDashboard
} from "../lib/api-client";

export async function getSelectedDashboard(input?: {
  appId?: string;
  baseUrl?: string;
  fetchImpl?: typeof fetch;
}) {
  return (await fetchSelectedDashboard({
    baseUrl: input?.baseUrl,
    fetchImpl: input?.fetchImpl
  })) as SelectedDashboard;
}

export async function setSelectedDashboard(input: {
  appId?: string;
  dashboardId: string | null;
  baseUrl?: string;
  fetchImpl?: typeof fetch;
}) {
  return (await updateSelectedDashboard({
    dashboardId: input.dashboardId,
    baseUrl: input.baseUrl,
    fetchImpl: input.fetchImpl
  })) as SelectedDashboard;
}
