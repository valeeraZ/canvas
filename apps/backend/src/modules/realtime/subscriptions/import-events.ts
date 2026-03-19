import { createChannelName } from "../server";

export function importEventsChannel(tenantId: string) {
  return createChannelName(tenantId, "imports");
}
