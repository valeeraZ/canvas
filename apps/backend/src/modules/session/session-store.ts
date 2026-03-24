import { randomUUID } from "node:crypto";
import type { FastifyReply, FastifyRequest } from "fastify";
import type { ExpiringStore } from "../../../../../packages/auth/src/expiring-store.js";

export const CANVAS_SESSION_COOKIE = "canvas_session";
export const DEFAULT_SESSION_TTL_SECONDS = 1800;

export type CanvasSessionRecord = {
  sessionId: string;
  selectedApp: string;
  externalUserId: string;
};

export type CanvasSessionStore = {
  create(input: {
    selectedApp: string;
    externalUserId: string;
  }): Promise<CanvasSessionRecord>;
  get(sessionId: string): Promise<CanvasSessionRecord | null>;
  set(sessionId: string, input: {
    selectedApp: string;
    externalUserId: string;
  }): Promise<CanvasSessionRecord>;
  delete(sessionId: string): Promise<void>;
};

export function createCanvasSessionStore(input: {
  backingStore: ExpiringStore;
  ttlSeconds?: number;
}): CanvasSessionStore {
  const ttlSeconds = input.ttlSeconds ?? DEFAULT_SESSION_TTL_SECONDS;

  async function write(record: CanvasSessionRecord) {
    await input.backingStore.set(
      `canvas:sessions:${record.sessionId}`,
      JSON.stringify(record),
      ttlSeconds
    );
  }

  return {
    async create(payload) {
      const record: CanvasSessionRecord = {
        sessionId: randomUUID(),
        selectedApp: payload.selectedApp,
        externalUserId: payload.externalUserId
      };
      await write(record);
      return record;
    },
    async get(sessionId) {
      const raw = await input.backingStore.get(`canvas:sessions:${sessionId}`);
      return raw ? (JSON.parse(raw) as CanvasSessionRecord) : null;
    },
    async set(sessionId, payload) {
      const record: CanvasSessionRecord = {
        sessionId,
        selectedApp: payload.selectedApp,
        externalUserId: payload.externalUserId
      };
      await write(record);
      return record;
    },
    async delete(sessionId) {
      await input.backingStore.delete(`canvas:sessions:${sessionId}`);
    }
  };
}

export function readCanvasSessionId(request: FastifyRequest): string | undefined {
  const cookieValue = request.cookies[CANVAS_SESSION_COOKIE];
  return cookieValue && cookieValue.length > 0 ? cookieValue : undefined;
}

export function writeCanvasSessionCookie(
  reply: FastifyReply,
  sessionId: string,
  ttlSeconds: number = DEFAULT_SESSION_TTL_SECONDS
) {
  reply.setCookie(CANVAS_SESSION_COOKIE, sessionId, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    maxAge: ttlSeconds
  });
}
