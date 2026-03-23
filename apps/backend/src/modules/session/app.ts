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
      body: {
        type: "object",
        properties: {
          token: {
            type: "string"
          },
          appName: {
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
