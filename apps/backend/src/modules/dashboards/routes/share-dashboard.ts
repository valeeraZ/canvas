export type DashboardVisibilitySubjectType = "user" | "group" | "role";

export async function shareDashboard(input: {
  dashboardId: string;
  subjects: Array<{
    type: DashboardVisibilitySubjectType;
    id: string;
  }>;
}) {
  return {
    dashboardId: input.dashboardId,
    subjects: input.subjects
  };
}
