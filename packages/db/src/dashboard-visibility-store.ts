import { and, asc, eq, or } from "drizzle-orm";
import type { DbClient } from "./client.js";
import { dashboardVisibilityRules } from "./schema.js";

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

export function createDashboardVisibilityStore(db: DbClient) {
  return {
    async listByDashboard(input: { appId: string; dashboardId: string }) {
      const rules = await db
        .select()
        .from(dashboardVisibilityRules)
        .where(
          and(
            eq(dashboardVisibilityRules.tenantId, input.appId),
            eq(dashboardVisibilityRules.dashboardId, input.dashboardId)
          )
        )
        .orderBy(
          asc(dashboardVisibilityRules.subjectType),
          asc(dashboardVisibilityRules.subjectId)
        );

      return rules.map(toDashboardVisibilityRule);
    },
    async replaceRules(input: {
      appId: string;
      dashboardId: string;
      rules: DashboardVisibilityRule[];
    }) {
      await db
        .delete(dashboardVisibilityRules)
        .where(
          and(
            eq(dashboardVisibilityRules.tenantId, input.appId),
            eq(dashboardVisibilityRules.dashboardId, input.dashboardId)
          )
        );

      if (input.rules.length === 0) {
        return [] as DashboardVisibilityRule[];
      }

      const created = await db
        .insert(dashboardVisibilityRules)
        .values(
          input.rules.map((rule) => ({
            tenantId: input.appId,
            dashboardId: input.dashboardId,
            subjectType: rule.subjectType,
            subjectId: rule.subjectId
          }))
        )
        .returning();

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

      const subjectWhere = or(
        ...input.subjects.map((subject) =>
          and(
            eq(dashboardVisibilityRules.subjectType, subject.subjectType),
            eq(dashboardVisibilityRules.subjectId, subject.subjectId)
          )
        )
      );
      const rules = await db
        .select()
        .from(dashboardVisibilityRules)
        .where(
          subjectWhere
            ? and(eq(dashboardVisibilityRules.tenantId, input.appId), subjectWhere)
            : eq(dashboardVisibilityRules.tenantId, input.appId)
        )
        .orderBy(asc(dashboardVisibilityRules.dashboardId));

      return rules.map(toDashboardVisibilityRule);
    }
  };
}
