CREATE TABLE "DashboardVisibilityRule" (
  "id" TEXT PRIMARY KEY,
  "tenantId" TEXT NOT NULL,
  "dashboardId" TEXT NOT NULL,
  "subjectType" TEXT NOT NULL,
  "subjectId" TEXT NOT NULL,
  CONSTRAINT "DashboardVisibilityRule_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE CASCADE,
  CONSTRAINT "DashboardVisibilityRule_dashboardId_fkey" FOREIGN KEY ("dashboardId") REFERENCES "Dashboard" ("id") ON DELETE CASCADE
);

CREATE INDEX "DashboardVisibilityRule_tenantId_dashboardId_idx"
ON "DashboardVisibilityRule"("tenantId", "dashboardId");

CREATE TABLE "PrincipalAppPreference" (
  "principalId" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "selectedDashboardId" TEXT,
  PRIMARY KEY ("principalId", "tenantId"),
  CONSTRAINT "PrincipalAppPreference_principalId_fkey" FOREIGN KEY ("principalId") REFERENCES "Principal" ("id") ON DELETE CASCADE,
  CONSTRAINT "PrincipalAppPreference_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE CASCADE,
  CONSTRAINT "PrincipalAppPreference_selectedDashboardId_fkey" FOREIGN KEY ("selectedDashboardId") REFERENCES "Dashboard" ("id") ON DELETE SET NULL
);
