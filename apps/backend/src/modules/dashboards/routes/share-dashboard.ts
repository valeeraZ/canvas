export type DashboardVisibilitySubjectType = "user" | "group" | "role";

type ShareDashboardRule = {
  id?: string;
  dashboardId: string;
  appId: string;
  subjectType: DashboardVisibilitySubjectType;
  subjectId: string;
};

export async function shareDashboard(input: {
  appId: string;
  dashboardId: string;
  subjects: Array<{
    type: DashboardVisibilitySubjectType;
    id: string;
  }>;
  replaceRules: (input: {
    appId: string;
    dashboardId: string;
    rules: ShareDashboardRule[];
  }) => Promise<ShareDashboardRule[]>;
}) {
  const rules = await input.replaceRules({
    appId: input.appId,
    dashboardId: input.dashboardId,
    rules: input.subjects.map((subject) => ({
      appId: input.appId,
      dashboardId: input.dashboardId,
      subjectType: subject.type,
      subjectId: subject.id
    }))
  });

  return {
    rules,
    dashboardId: input.dashboardId,
    subjects: input.subjects
  };
}
