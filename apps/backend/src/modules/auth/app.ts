import type { FastifyPluginAsync } from "fastify";
import { buildTenantContextFromToken } from "../../../../../packages/auth/src/canvas-token-decode";
import { assertTenantContext } from "../../../../../packages/auth/src/tenant-context";

declare module "fastify" {
  interface FastifyRequest {
    tenantContext?: {
      tenantId: string;
      roles: string[];
    };
  }
}

function readBearerToken(header: string | undefined): string | null {
  if (!header?.startsWith("Bearer ")) {
    return null;
  }

  return header.slice("Bearer ".length).trim() || null;
}

export const authModule: FastifyPluginAsync = async (app) => {
  app.decorateRequest("tenantContext", null);

  app.addHook("preHandler", async (request) => {
    const token = readBearerToken(request.headers.authorization);

    if (!token) {
      return;
    }

    request.tenantContext = buildTenantContextFromToken(token);
  });

  app.get("/auth/me", async (request) => {
    return assertTenantContext(request.tenantContext);
  });
};
