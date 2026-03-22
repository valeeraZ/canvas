import type { FastifyPluginAsync } from "fastify";
import { decodeCanvasAccessToken } from "../../../../../packages/auth/src/canvas-token-decode";
import { assertTenantContext } from "../../../../../packages/auth/src/tenant-context";
import { selectApp } from "./routes/select-app";

declare module "fastify" {
  interface FastifyRequest {
    tenantContext?: {
      tenantId: string;
      externalUserId: string;
      roles: string[];
      groups: string[];
    };
  }
}

function readBearerToken(header: string | undefined): string | null {
  if (!header?.startsWith("Bearer ")) {
    return null;
  }

  return header.slice("Bearer ".length).trim() || null;
}

function readGroups(header: string | undefined): string[] {
  if (!header) {
    return [];
  }

  return header
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
}

export const authModule: FastifyPluginAsync = async (app) => {
  app.decorateRequest("tenantContext", null);

  app.addHook("preHandler", async (request) => {
    const token = readBearerToken(request.headers.authorization);

    if (!token) {
      return;
    }

    const claims = decodeCanvasAccessToken(token);

    request.tenantContext = {
      tenantId: claims.tenantId,
      externalUserId: claims.externalUserId,
      roles: claims.roles,
      groups: readGroups(request.headers["x-canvas-groups"] as string | undefined)
    };
  });

  app.get("/auth/me", async (request) => {
    return assertTenantContext(request.tenantContext);
  });

  app.post<{
    Body: {
      appName?: string;
    };
  }>("/auth/select-app", async (request, reply) => {
    const token = readBearerToken(request.headers.authorization);

    if (!token) {
      reply.status(401);
      return {
        message: "Missing bearer token"
      };
    }

    if (!request.body?.appName) {
      reply.status(400);
      return {
        message: "appName is required"
      };
    }

    return selectApp({
      accessToken: token,
      appName: request.body.appName
    });
  });
};
