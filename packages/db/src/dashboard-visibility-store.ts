import type { PrismaClient } from "./generated/prisma/client.js";

export type DashboardVisibilityRule = {
  id?: string;
  dashboardId: string;
  appId: string;
  subjectType: "user" | "group" | "role";
  subjectId: string;
};

type PersistedDashboardVisibilityRule = {
  id: string;
  tenantId: string;
  dashboardId: string;
  subjectType: string;
  subjectId: string;
};

export function toDashboardVisibilityRule(
  input: PersistedDashboardVisibilityRule
): DashboardVisibilityRule {
  return {
    id: input.id,
    appId: input.tenantId,
    dashboardId: input.dashboardId,
    subjectType: input.subjectType as DashboardVisibilityRule["subjectType"],
    subjectId: input.subjectId
  };
}

export function createDashboardVisibilityStore(prisma: PrismaClient) {
  return {
    async listByDashboard(input: { appId: string; dashboardId: string }) {
      const rules = await prisma.dashboardVisibilityRule.findMany({
        where: {
          tenantId: input.appId,
          dashboardId: input.dashboardId
        },
        orderBy: [{ subjectType: "asc" }, { subjectId: "asc" }]
      });

      return rules.map(toDashboardVisibilityRule);
    },
    async replaceRules(input: {
      appId: string;
      dashboardId: string;
      rules: DashboardVisibilityRule[];
    }) {
      await prisma.dashboardVisibilityRule.deleteMany({
        where: {
          tenantId: input.appId,
          dashboardId: input.dashboardId
        }
      });

      if (input.rules.length === 0) {
        return [] as DashboardVisibilityRule[];
      }

      const created = await prisma.dashboardVisibilityRule.createManyAndReturn({
        data: input.rules.map((rule) => ({
          tenantId: input.appId,
          dashboardId: input.dashboardId,
          subjectType: rule.subjectType,
          subjectId: rule.subjectId
        }))
      });

      return created.map(toDashboardVisibilityRule);
    },
    async listByAppAndSubjects(input: {
      appId: string;
      subjects: Array<{
        subjectType: DashboardVisibilityRule["subjectType"];
        subjectId: string;
      }>;
    }) {
      if (input.subjects.length === 0) {
        return [] as DashboardVisibilityRule[];
      }

      const rules = await prisma.dashboardVisibilityRule.findMany({
        where: {
          tenantId: input.appId,
          OR: input.subjects.map((subject) => ({
            subjectType: subject.subjectType,
            subjectId: subject.subjectId
          }))
        },
        orderBy: {
          dashboardId: "asc"
        }
      });

      return rules.map(toDashboardVisibilityRule);
    }
  };
}
