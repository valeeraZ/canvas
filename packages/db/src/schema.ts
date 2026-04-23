import { randomUUID } from "node:crypto";
import { relations } from "drizzle-orm";
import {
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
  unique,
  uniqueIndex
} from "drizzle-orm/pg-core";

function idColumn() {
  return text("id")
    .primaryKey()
    .$defaultFn(() => randomUUID());
}

export const tenants = pgTable("Tenant", {
  id: idColumn(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull()
});

export const principals = pgTable("Principal", {
  id: idColumn(),
  externalUserId: text("externalUserId").notNull().unique()
});

export const memberships = pgTable(
  "Membership",
  {
    id: idColumn(),
    tenantId: text("tenantId")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    principalId: text("principalId")
      .notNull()
      .references(() => principals.id, { onDelete: "cascade" }),
    role: text("role").notNull()
  },
  (table) => [
    uniqueIndex("Membership_tenantId_principalId_key").on(
      table.tenantId,
      table.principalId
    )
  ]
);

export const datasets = pgTable("Dataset", {
  id: idColumn(),
  tenantId: text("tenantId")
    .notNull()
    .references(() => tenants.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  status: text("status").notNull(),
  warnings: jsonb("warnings"),
  preview: jsonb("preview"),
  uploadedByExternalUserId: text("uploadedByExternalUserId"),
  uploadedByDisplayName: text("uploadedByDisplayName"),
  uploadedAt: timestamp("uploadedAt", { mode: "date", precision: 3 }),
  sourceFilename: text("sourceFilename"),
  contentType: text("contentType"),
  sizeBytes: integer("sizeBytes"),
  storageBucket: text("storageBucket"),
  storageObjectKey: text("storageObjectKey"),
  storageUploadId: text("storageUploadId"),
  importStatus: text("importStatus")
});

export const datasetRows = pgTable(
  "DatasetRow",
  {
    id: idColumn(),
    tenantId: text("tenantId").notNull(),
    datasetId: text("datasetId")
      .notNull()
      .references(() => datasets.id, { onDelete: "cascade" }),
    rowIndex: integer("rowIndex").notNull(),
    record: jsonb("record").notNull()
  },
  (table) => [
    uniqueIndex("DatasetRow_datasetId_rowIndex_key").on(
      table.datasetId,
      table.rowIndex
    ),
    index("DatasetRow_tenantId_datasetId_rowIndex_idx").on(
      table.tenantId,
      table.datasetId,
      table.rowIndex
    )
  ]
);

export const importJobs = pgTable("ImportJob", {
  id: idColumn(),
  datasetId: text("datasetId")
    .notNull()
    .references(() => datasets.id, { onDelete: "cascade" }),
  tenantId: text("tenantId").notNull(),
  status: text("status").notNull(),
  objectKey: text("objectKey").notNull(),
  warnings: jsonb("warnings"),
  claimedAt: timestamp("claimedAt", { mode: "date", precision: 3 }),
  completedAt: timestamp("completedAt", { mode: "date", precision: 3 })
});

export const workbooks = pgTable("Workbook", {
  id: idColumn(),
  tenantId: text("tenantId")
    .notNull()
    .references(() => tenants.id, { onDelete: "cascade" }),
  name: text("name").notNull()
});

export const dashboards = pgTable(
  "Dashboard",
  {
    id: idColumn(),
    tenantId: text("tenantId")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    workbookId: text("workbookId"),
    name: text("name").notNull(),
    status: text("status").notNull().default("active"),
    createdByExternalUserId: text("createdByExternalUserId"),
    createdByDisplayName: text("createdByDisplayName"),
    createdAt: timestamp("createdAt", { mode: "date", precision: 3 })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updatedAt", { mode: "date", precision: 3 })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date())
  },
  (table) => [unique("Dashboard_id_tenantId_key").on(table.id, table.tenantId)]
);

export const dashboardWidgets = pgTable("DashboardWidget", {
  id: idColumn(),
  tenantId: text("tenantId").notNull(),
  dashboardId: text("dashboardId")
    .notNull()
    .references(() => dashboards.id, { onDelete: "cascade" }),
  type: text("type").notNull(),
  datasetId: text("datasetId").references(() => datasets.id, {
    onDelete: "set null"
  }),
  config: jsonb("config"),
  layout: jsonb("layout")
});

export const dashboardVisibilityRules = pgTable(
  "DashboardVisibilityRule",
  {
    id: idColumn(),
    tenantId: text("tenantId")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    dashboardId: text("dashboardId")
      .notNull()
      .references(() => dashboards.id, { onDelete: "cascade" }),
    subjectType: text("subjectType").notNull(),
    subjectId: text("subjectId").notNull()
  },
  (table) => [
    index("DashboardVisibilityRule_tenantId_dashboardId_idx").on(
      table.tenantId,
      table.dashboardId
    )
  ]
);

export const principalAppPreferences = pgTable(
  "PrincipalAppPreference",
  {
    principalId: text("principalId")
      .notNull()
      .references(() => principals.id, { onDelete: "cascade" }),
    tenantId: text("tenantId")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    selectedDashboardId: text("selectedDashboardId").references(
      () => dashboards.id,
      { onDelete: "set null" }
    )
  },
  (table) => [primaryKey({ columns: [table.principalId, table.tenantId] })]
);

export const tenantsRelations = relations(tenants, ({ many }) => ({
  memberships: many(memberships),
  datasets: many(datasets),
  workbooks: many(workbooks),
  dashboards: many(dashboards),
  visibilityRules: many(dashboardVisibilityRules),
  appPreferences: many(principalAppPreferences)
}));

export const principalsRelations = relations(principals, ({ many }) => ({
  memberships: many(memberships),
  appPreferences: many(principalAppPreferences)
}));

export const membershipsRelations = relations(memberships, ({ one }) => ({
  tenant: one(tenants, {
    fields: [memberships.tenantId],
    references: [tenants.id]
  }),
  principal: one(principals, {
    fields: [memberships.principalId],
    references: [principals.id]
  })
}));

export const datasetsRelations = relations(datasets, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [datasets.tenantId],
    references: [tenants.id]
  }),
  rows: many(datasetRows),
  importJobs: many(importJobs),
  widgets: many(dashboardWidgets)
}));

export const datasetRowsRelations = relations(datasetRows, ({ one }) => ({
  dataset: one(datasets, {
    fields: [datasetRows.datasetId],
    references: [datasets.id]
  })
}));

export const importJobsRelations = relations(importJobs, ({ one }) => ({
  dataset: one(datasets, {
    fields: [importJobs.datasetId],
    references: [datasets.id]
  })
}));

export const workbooksRelations = relations(workbooks, ({ one }) => ({
  tenant: one(tenants, {
    fields: [workbooks.tenantId],
    references: [tenants.id]
  })
}));

export const dashboardsRelations = relations(dashboards, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [dashboards.tenantId],
    references: [tenants.id]
  }),
  widgets: many(dashboardWidgets),
  visibilityRules: many(dashboardVisibilityRules),
  appPreferences: many(principalAppPreferences)
}));

export const dashboardWidgetsRelations = relations(dashboardWidgets, ({ one }) => ({
  dashboard: one(dashboards, {
    fields: [dashboardWidgets.dashboardId],
    references: [dashboards.id]
  }),
  dataset: one(datasets, {
    fields: [dashboardWidgets.datasetId],
    references: [datasets.id]
  })
}));

export const dashboardVisibilityRulesRelations = relations(
  dashboardVisibilityRules,
  ({ one }) => ({
    tenant: one(tenants, {
      fields: [dashboardVisibilityRules.tenantId],
      references: [tenants.id]
    }),
    dashboard: one(dashboards, {
      fields: [dashboardVisibilityRules.dashboardId],
      references: [dashboards.id]
    })
  })
);

export const principalAppPreferencesRelations = relations(
  principalAppPreferences,
  ({ one }) => ({
    principal: one(principals, {
      fields: [principalAppPreferences.principalId],
      references: [principals.id]
    }),
    tenant: one(tenants, {
      fields: [principalAppPreferences.tenantId],
      references: [tenants.id]
    }),
    selectedDashboard: one(dashboards, {
      fields: [principalAppPreferences.selectedDashboardId],
      references: [dashboards.id]
    })
  })
);

