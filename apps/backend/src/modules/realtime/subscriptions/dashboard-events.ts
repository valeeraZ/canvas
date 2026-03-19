import { createChannelName } from "../server";

export function dashboardEventsChannel(tenantId: string) {
  return createChannelName(tenantId, "dashboards");
}
