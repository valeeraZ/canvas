import type { FastifyPluginAsync } from "fastify";
import type { AuthorizationContext } from "../../../../../packages/auth/src/authorization-api";
import { exchangeHostAssertion } from "./routes/exchange-session";

type SessionExchangeBody = {
  token?: string;
  appName?: string;
};

export type SessionModuleOptions = {
  authBaseUrl: string;
  mockContext?: AuthorizationContext;
};

export const sessionModule: FastifyPluginAsync<SessionModuleOptions> = async (
  app,
  options
) => {
  app.get("/session/exchange", async () => {
    return {
      signedAssertion: "local-dev-assertion"
    };
  });

  app.post<{
    Body: SessionExchangeBody;
  }>("/session/exchange", async (request) => {
    return exchangeHostAssertion({
      authBaseUrl: options.authBaseUrl,
      token: request.body?.token ?? "local-dev-token",
      appName: request.body?.appName ?? "canvas",
      mockContext: options.mockContext
    });
  });
};

export { exchangeHostAssertion } from "./routes/exchange-session";
