export type PrincipalAppPreference = {
  principalId: string;
  appId: string;
  selectedDashboardId: string | null;
};

export function createPrincipalAppPreferenceStore() {
  return {
    async get(input: { principalId: string; appId: string }) {
      return {
        principalId: input.principalId,
        appId: input.appId,
        selectedDashboardId: null
      } as PrincipalAppPreference;
    },
    async set(input: PrincipalAppPreference) {
      return input;
    }
  };
}
