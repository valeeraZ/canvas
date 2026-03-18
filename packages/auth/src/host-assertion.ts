import { fetchAuthorizationContext } from "./authorization-api";

export type HostAssertion = {
  tenantId: string;
  externalUserId: string;
  displayName: string;
  roles: string[];
};

export async function buildHostAssertion(input: {
  authBaseUrl: string;
  token: string;
  appName: string;
  fetchImpl?: typeof fetch;
}): Promise<HostAssertion> {
  const context = await fetchAuthorizationContext(input);

  return {
    tenantId: input.appName,
    externalUserId: context.employeeId,
    displayName: context.displayName,
    roles: context.roles
  };
}
