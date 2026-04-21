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

export type AuthorizationAppMetadata = {
  appName: string;
  appDisplayName: string;
  appLogoName: string;
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

function normalizeAppName(value: string | undefined) {
  return value?.trim() ?? "";
}

function normalizeRoles(
  value:
    | string[]
    | {
        roles?: string[];
      }
    | undefined
) {
  if (Array.isArray(value)) {
    return value;
  }

  if (Array.isArray(value?.roles)) {
    return value.roles;
  }

  return [];
}

function normalizeAccessibleApp(item: {
  app_name?: string;
  appName?: string;
  roles?:
    | string[]
    | {
        roles?: string[];
      };
}): AccessibleApp {
  return {
    appName: normalizeAppName(item.app_name ?? item.appName),
    roles: normalizeRoles(item.roles)
  };
}

function filterAppsWithRoles(apps: AccessibleApp[]) {
  return apps.filter((app) => app.roles.length > 0);
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
    return filterAppsWithRoles(input.mockAccessibleApps);
  }

  if (input.mockContext) {
    return filterAppsWithRoles([
      {
        appName: "canvas",
        roles: input.mockContext.roles
      },
      {
        appName: "canvas-ops",
        roles: input.mockContext.roles
      }
    ]);
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
    roles:
      | string[]
      | {
          roles?: string[];
        };
  }>;

  return filterAppsWithRoles(payload.map(normalizeAccessibleApp));
}

export async function fetchAppMetadata(input: {
  authBaseUrl: string;
  token: string;
  appName: string;
  fetchImpl?: typeof fetch;
}): Promise<AuthorizationAppMetadata> {
  const fetchImpl = input.fetchImpl ?? fetch;
  const baseUrl = input.authBaseUrl.replace(/\/+$/, "");
  const response = await fetchImpl(
    `${baseUrl}/v1/app/${encodeURIComponent(input.appName)}`,
    {
      headers: createHeaders(input.token)
    }
  );

  if (!response.ok) {
    throw new Error("Failed to fetch app metadata");
  }

  const payload = (await response.json()) as {
    app_name?: string;
    appName?: string;
    app_display_name?: string;
    appDisplayName?: string;
    app_logo_name?: string;
    appLogoName?: string;
  };

  return {
    appName: normalizeAppName(payload.app_name ?? payload.appName) || input.appName,
    appDisplayName:
      payload.app_display_name ?? payload.appDisplayName ?? input.appName,
    appLogoName: payload.app_logo_name ?? payload.appLogoName ?? "app-window"
  };
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

  const accessibleApps = await fetchAccessibleApps({
    authBaseUrl: baseUrl,
    token: input.token,
    fetchImpl,
    mockContext: input.mockContext,
    mockAccessibleApps: input.mockAccessibleApps
  });
  const matchedApp = accessibleApps.find((app) => app.appName === input.appName);

  if (!matchedApp) {
    throw new Error("App is not accessible to the current principal");
  }

  return {
    displayName: currentUser.display_name,
    employeeId: currentUser.employee_id,
    roles: matchedApp.roles
  };
}
