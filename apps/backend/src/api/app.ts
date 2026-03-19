import Fastify from "fastify";
import type { AuthorizationContext } from "../../../../packages/auth/src/authorization-api";
import { sessionModule } from "../modules/session/app";

export type CreateApiAppOptions = {
  authBaseUrl: string;
  mockContext?: AuthorizationContext;
};

export function createApiApp(options: CreateApiAppOptions) {
  const app = Fastify();

  app.get("/health", async () => {
    return {
      status: "ok" as const
    };
  });

  void app.register(sessionModule, options);

  return app;
}
