export async function selectApp(input: {
  principalId: string;
  appId: string;
}) {
  return {
    principalId: input.principalId,
    appId: input.appId
  };
}
