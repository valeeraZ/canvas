export type AuthorizationContext = {
  displayName: string;
  employeeId: string;
  roles: string[];
};

export type AuthorizationApiInput = {
  authBaseUrl: string;
  token: string;
  appName: string;
  fetchImpl?: typeof fetch;
  mockContext?: AuthorizationContext;
};

function createHeaders(token: string): HeadersInit {
  return {
    Authorization: `Bearer ${token}`
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

  const currentUserResponse = await fetchImpl(
    `${baseUrl}/v1/authorization/current_user`,
    {
      headers: createHeaders(input.token)
    }
  );

  if (!currentUserResponse.ok) {
    throw new Error("Failed to fetch current user");
  }

  const currentUser = (await currentUserResponse.json()) as {
    display_name: string;
    employee_id: string;
  };

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
