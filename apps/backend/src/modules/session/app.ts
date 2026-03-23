import type { FastifyPluginAsync } from "fastify";
import type {
  AuthorizationContext,
  AuthorizationResolver
} from "../../../../../packages/auth/src";
import type { PrismaClient } from "../../../../../packages/db/src/generated/prisma/client";
import { sessionExchangeResponseSchema } from "../../api/schema";
import { exchangeHostAssertion } from "./routes/exchange-session";
import type { CanvasSessionStore } from "./session-store";
import { writeCanvasSessionCookie } from "./session-store";

type SessionExchangeBody = {
  token?: string;
  appName?: string;
};

export type SessionModuleOptions = {
  authBaseUrl: string;
  mockContext?: AuthorizationContext;
  db?: PrismaClient;
  authorizationResolver: AuthorizationResolver;
  sessionStore: CanvasSessionStore;
  sessionTtlSeconds?: number;
};

export const sessionModule: FastifyPluginAsync<SessionModuleOptions> = async (
  app,
  options
) => {
  app.get("/session/exchange", {
    schema: {
      tags: ["session"],
      summary: "Get a local development signed assertion placeholder",
      description:
        "Returns a placeholder assertion for local development flows that still expect a signed assertion round-trip.",
      response: {
        200: {
          type: "object",
          properties: {
            signedAssertion: {
              type: "string"
            }
          },
          required: ["signedAssertion"]
        }
      }
    }
  }, async () => {
    return {
      signedAssertion: "local-dev-assertion"
    };
  });

  app.post<{
    Body: SessionExchangeBody;
  }>("/session/exchange", {
    schema: {
      tags: ["session"],
      summary: "Exchange an amtoken for a Canvas server session",
      description:
        "Resolves Authorization: Bearer <amtoken> or a posted token against external authorization APIs, persists the selected app in the Canvas-managed canvas_session cookie, and returns a principal snapshot.",
      body: {
        type: "object",
        properties: {
          token: {
            description: "Optional amtoken. When omitted, local development defaults are used.",
            type: "string"
          },
          appName: {
            description: "App to resolve and store as the active Canvas session app.",
            type: "string"
          }
        }
      },
      response: {
        200: sessionExchangeResponseSchema
      }
    }
  }, async (request, reply) => {
    const session = await exchangeHostAssertion({
      authBaseUrl: options.authBaseUrl,
      token: request.body?.token ?? "local-dev-token",
      appName: request.body?.appName ?? "canvas",
      mockContext: options.mockContext,
      authorizationResolver: options.authorizationResolver,
      db: options.db
    });

    const storedSession = await options.sessionStore.create({
      selectedApp: session.selectedApp,
      externalUserId: session.principal.employeeId
    });

    writeCanvasSessionCookie(
      reply,
      storedSession.sessionId,
      options.sessionTtlSeconds
    );

    return session;
  });
};

export { exchangeHostAssertion } from "./routes/exchange-session";
