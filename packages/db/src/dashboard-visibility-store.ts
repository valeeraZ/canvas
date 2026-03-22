export type DashboardVisibilityRule = {
  dashboardId: string;
  appId: string;
  subjectType: "user" | "group" | "role";
  subjectId: string;
};

export function createDashboardVisibilityStore() {
  return {
    async listByDashboard(_: { appId: string; dashboardId: string }) {
      return [] as DashboardVisibilityRule[];
    },
    async replaceRules(input: {
      appId: string;
      dashboardId: string;
      rules: DashboardVisibilityRule[];
    }) {
      return input.rules;
    }
  };
}
