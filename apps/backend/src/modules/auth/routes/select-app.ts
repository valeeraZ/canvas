export async function selectApp(input: {
  appName: string;
  roles: string[];
}) {
  return {
    tenantId: input.appName,
    roles: input.roles
  };
}
