import { buildHostAssertion } from "../../../../../../packages/auth/src/host-assertion";
import type { AuthorizationContext } from "../../../../../../packages/auth/src/authorization-api";
import { mintCanvasAccessToken } from "../../../../../../packages/auth/src/canvas-token";
import type { SessionExchangeResult } from "../../../../../../packages/contracts/src/session";

export async function exchangeHostAssertion(input: {
  authBaseUrl: string;
  token: string;
  appName: string;
  fetchImpl?: typeof fetch;
  mockContext?: AuthorizationContext;
}): Promise<SessionExchangeResult> {
  const assertion = await buildHostAssertion(input);
  const accessToken = mintCanvasAccessToken({
    tenantId: assertion.tenantId,
    externalUserId: assertion.externalUserId,
    roles: assertion.roles
  });

  return {
    accessToken,
    expiresIn: 900,
    principal: {
      employeeId: assertion.externalUserId,
      displayName: assertion.displayName,
      roles: assertion.roles
    }
  };
}
