import type { VisibleDashboard } from "../../../../contracts/src/embed-viewer";
import { listVisibleDashboards as fetchVisibleDashboards } from "../lib/api-client";

export async function listVisibleDashboards(input?: {
  appId?: string;
  baseUrl?: string;
  fetchImpl?: typeof fetch;
}) {
  return (await fetchVisibleDashboards({
    baseUrl: input?.baseUrl,
    fetchImpl: input?.fetchImpl
  })) as VisibleDashboard[];
}
