export function createStubService(name: string) {
  return { name, status: "bootstrapped" as const };
}

export { createChannelName } from "./server";
export { importEventsChannel } from "./subscriptions/import-events";
export { dashboardEventsChannel } from "./subscriptions/dashboard-events";
