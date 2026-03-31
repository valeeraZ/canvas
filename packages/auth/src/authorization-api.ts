export type AuthorizationContext = {
  displayName: string;
  employeeId: string;
  roles: string[];
};

export type AuthorizationPrincipal = {
  displayName: string;
  employeeId: string;
};

export type AccessibleApp = {
  appName: string;
  roles: string[];
};

export type AuthorizationApiInput = {
  authBaseUrl: string;
  token: string;
  appName: string;
  fetchImpl?: typeof fetch;
  mockContext?: AuthorizationContext;
  mockAccessibleApps?: AccessibleApp[];
};

function createHeaders(token: string): HeadersInit {
  return {
    Authorization: `Bearer ${token}`
  };
}

async function fetchCurrentUser(input: {
  authBaseUrl: string;
  token: string;
  fetchImpl?: typeof fetch;
}) {
  const fetchImpl = input.fetchImpl ?? fetch;
  const baseUrl = input.authBaseUrl.replace(/\/+$/, "");
  const response = await fetchImpl(`${baseUrl}/v1/authorization/current_user`, {
    headers: createHeaders(input.token)
  });

  if (!response.ok) {
    throw new Error("Failed to fetch current user");
  }

  return (await response.json()) as {
    display_name: string;
    employee_id: string;
  };
}

export async function fetchCurrentPrincipal(input: {
  authBaseUrl: string;
  token: string;
  fetchImpl?: typeof fetch;
  mockContext?: AuthorizationContext;
}): Promise<AuthorizationPrincipal> {
  if (input.mockContext) {
    return {
      displayName: input.mockContext.displayName,
      employeeId: input.mockContext.employeeId
    };
  }

  const currentUser = await fetchCurrentUser(input);
  return {
    displayName: currentUser.display_name,
    employeeId: currentUser.employee_id
  };
}

export async function fetchAccessibleApps(input: {
  authBaseUrl: string;
  token: string;
  fetchImpl?: typeof fetch;
  mockContext?: AuthorizationContext;
  mockAccessibleApps?: AccessibleApp[];
}): Promise<AccessibleApp[]> {
  if (input.mockAccessibleApps?.length) {
    return input.mockAccessibleApps;
  }

  if (input.mockContext) {
    return [
      {
        appName: "canvas",
        roles: input.mockContext.roles
      },
      {
        appName: "canvas-ops",
        roles: input.mockContext.roles
      }
    ];
  }

  const fetchImpl = input.fetchImpl ?? fetch;
  const baseUrl = input.authBaseUrl.replace(/\/+$/, "");
  const response = await fetchImpl(`${baseUrl}/v1/authorization/roles`, {
    headers: createHeaders(input.token)
  });

  if (!response.ok) {
    throw new Error("Failed to fetch accessible apps");
  }

  const payload = (await response.json()) as Array<{
    app_name: string;
    roles: string[];
  }>;

  return payload.map((item) => ({
    appName: item.app_name,
    roles: item.roles
  }));
}

export async function fetchAuthorizationContext(
  input: AuthorizationApiInput
): Promise<AuthorizationContext> {
  if (input.mockContext) {
    return input.mockContext;
  }

  const fetchImpl = input.fetchImpl ?? fetch;
  const baseUrl = input.authBaseUrl.replace(/\/+$/, "");
  const currentUser = await fetchCurrentUser({
    authBaseUrl: baseUrl,
    token: input.token,
    fetchImpl
  });

  const rolesResponse = await fetchImpl(
    `${baseUrl}/v1/authorization/roles/${input.appName}`,
    {
      headers: createHeaders(input.token)
    }
  );

  if (!rolesResponse.ok) {
    throw new Error("Failed to fetch tenant roles");
  }

  const roles = (await rolesResponse.json()) as { roles: string[] };

  return {
    displayName: currentUser.display_name,
    employeeId: currentUser.employee_id,
    roles: roles.roles
  };
}
