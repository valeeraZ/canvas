export type RealtimeTopic = "imports" | "dashboards";

export type RealtimeEvent<TPayload = Record<string, unknown>> = {
  tenantId: string;
  topic: RealtimeTopic;
  type: string;
  payload: TPayload;
};
