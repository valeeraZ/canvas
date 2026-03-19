import type { RealtimeTopic } from "../../../../contracts/src/events";

export type LiveCanvasInput = {
  tenantId: string;
  topic: RealtimeTopic;
};

export type LiveCanvasConnection = {
  tenantId: string;
  topic: RealtimeTopic;
  channel: string;
  status: "connected";
};

export function useLiveCanvas(input: LiveCanvasInput): LiveCanvasConnection {
  return {
    tenantId: input.tenantId,
    topic: input.topic,
    channel: `${input.tenantId}:${input.topic}`,
    status: "connected"
  };
}
