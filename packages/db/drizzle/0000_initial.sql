CREATE TABLE "DashboardVisibilityRule" (
	"id" text PRIMARY KEY NOT NULL,
	"tenantId" text NOT NULL,
	"dashboardId" text NOT NULL,
	"subjectType" text NOT NULL,
	"subjectId" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "DashboardWidget" (
	"id" text PRIMARY KEY NOT NULL,
	"tenantId" text NOT NULL,
	"dashboardId" text NOT NULL,
	"type" text NOT NULL,
	"datasetId" text,
	"config" jsonb,
	"layout" jsonb
);
--> statement-breakpoint
CREATE TABLE "Dashboard" (
	"id" text PRIMARY KEY NOT NULL,
	"tenantId" text NOT NULL,
	"workbookId" text,
	"name" text NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"createdByExternalUserId" text,
	"createdByDisplayName" text,
	"createdAt" timestamp (3) DEFAULT now() NOT NULL,
	"updatedAt" timestamp (3) DEFAULT now() NOT NULL,
	CONSTRAINT "Dashboard_id_tenantId_key" UNIQUE("id","tenantId")
);
--> statement-breakpoint
CREATE TABLE "DatasetRow" (
	"id" text PRIMARY KEY NOT NULL,
	"tenantId" text NOT NULL,
	"datasetId" text NOT NULL,
	"rowIndex" integer NOT NULL,
	"record" jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Dataset" (
	"id" text PRIMARY KEY NOT NULL,
	"tenantId" text NOT NULL,
	"name" text NOT NULL,
	"status" text NOT NULL,
	"warnings" jsonb,
	"preview" jsonb,
	"uploadedByExternalUserId" text,
	"uploadedByDisplayName" text,
	"uploadedAt" timestamp (3),
	"sourceFilename" text,
	"contentType" text,
	"sizeBytes" integer,
	"storageBucket" text,
	"storageObjectKey" text,
	"storageUploadId" text,
	"importStatus" text
);
--> statement-breakpoint
CREATE TABLE "ImportJob" (
	"id" text PRIMARY KEY NOT NULL,
	"datasetId" text NOT NULL,
	"tenantId" text NOT NULL,
	"status" text NOT NULL,
	"objectKey" text NOT NULL,
	"warnings" jsonb,
	"claimedAt" timestamp (3),
	"completedAt" timestamp (3)
);
--> statement-breakpoint
CREATE TABLE "Membership" (
	"id" text PRIMARY KEY NOT NULL,
	"tenantId" text NOT NULL,
	"principalId" text NOT NULL,
	"role" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "PrincipalAppPreference" (
	"principalId" text NOT NULL,
	"tenantId" text NOT NULL,
	"selectedDashboardId" text,
	CONSTRAINT "PrincipalAppPreference_principalId_tenantId_pk" PRIMARY KEY("principalId","tenantId")
);
--> statement-breakpoint
CREATE TABLE "Principal" (
	"id" text PRIMARY KEY NOT NULL,
	"externalUserId" text NOT NULL,
	CONSTRAINT "Principal_externalUserId_unique" UNIQUE("externalUserId")
);
--> statement-breakpoint
CREATE TABLE "Tenant" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	CONSTRAINT "Tenant_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "Workbook" (
	"id" text PRIMARY KEY NOT NULL,
	"tenantId" text NOT NULL,
	"name" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "DashboardVisibilityRule" ADD CONSTRAINT "DashboardVisibilityRule_tenantId_Tenant_id_fk" FOREIGN KEY ("tenantId") REFERENCES "public"."Tenant"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "DashboardVisibilityRule" ADD CONSTRAINT "DashboardVisibilityRule_dashboardId_Dashboard_id_fk" FOREIGN KEY ("dashboardId") REFERENCES "public"."Dashboard"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "DashboardWidget" ADD CONSTRAINT "DashboardWidget_dashboardId_Dashboard_id_fk" FOREIGN KEY ("dashboardId") REFERENCES "public"."Dashboard"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "DashboardWidget" ADD CONSTRAINT "DashboardWidget_datasetId_Dataset_id_fk" FOREIGN KEY ("datasetId") REFERENCES "public"."Dataset"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Dashboard" ADD CONSTRAINT "Dashboard_tenantId_Tenant_id_fk" FOREIGN KEY ("tenantId") REFERENCES "public"."Tenant"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "DatasetRow" ADD CONSTRAINT "DatasetRow_datasetId_Dataset_id_fk" FOREIGN KEY ("datasetId") REFERENCES "public"."Dataset"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Dataset" ADD CONSTRAINT "Dataset_tenantId_Tenant_id_fk" FOREIGN KEY ("tenantId") REFERENCES "public"."Tenant"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ImportJob" ADD CONSTRAINT "ImportJob_datasetId_Dataset_id_fk" FOREIGN KEY ("datasetId") REFERENCES "public"."Dataset"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Membership" ADD CONSTRAINT "Membership_tenantId_Tenant_id_fk" FOREIGN KEY ("tenantId") REFERENCES "public"."Tenant"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Membership" ADD CONSTRAINT "Membership_principalId_Principal_id_fk" FOREIGN KEY ("principalId") REFERENCES "public"."Principal"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "PrincipalAppPreference" ADD CONSTRAINT "PrincipalAppPreference_principalId_Principal_id_fk" FOREIGN KEY ("principalId") REFERENCES "public"."Principal"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "PrincipalAppPreference" ADD CONSTRAINT "PrincipalAppPreference_tenantId_Tenant_id_fk" FOREIGN KEY ("tenantId") REFERENCES "public"."Tenant"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "PrincipalAppPreference" ADD CONSTRAINT "PrincipalAppPreference_selectedDashboardId_Dashboard_id_fk" FOREIGN KEY ("selectedDashboardId") REFERENCES "public"."Dashboard"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Workbook" ADD CONSTRAINT "Workbook_tenantId_Tenant_id_fk" FOREIGN KEY ("tenantId") REFERENCES "public"."Tenant"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "DashboardVisibilityRule_tenantId_dashboardId_idx" ON "DashboardVisibilityRule" USING btree ("tenantId","dashboardId");--> statement-breakpoint
CREATE UNIQUE INDEX "DatasetRow_datasetId_rowIndex_key" ON "DatasetRow" USING btree ("datasetId","rowIndex");--> statement-breakpoint
CREATE INDEX "DatasetRow_tenantId_datasetId_rowIndex_idx" ON "DatasetRow" USING btree ("tenantId","datasetId","rowIndex");--> statement-breakpoint
CREATE UNIQUE INDEX "Membership_tenantId_principalId_key" ON "Membership" USING btree ("tenantId","principalId");