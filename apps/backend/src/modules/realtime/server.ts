export function createChannelName(tenantId: string, topic: string) {
  return `${tenantId}:${topic}`;
}
