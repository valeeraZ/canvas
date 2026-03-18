CREATE TABLE "Tenant" (
  "id" TEXT PRIMARY KEY,
  "slug" TEXT NOT NULL UNIQUE,
  "name" TEXT NOT NULL
);

CREATE TABLE "Principal" (
  "id" TEXT PRIMARY KEY,
  "externalUserId" TEXT NOT NULL UNIQUE
);

CREATE TABLE "Membership" (
  "id" TEXT PRIMARY KEY,
  "tenantId" TEXT NOT NULL,
  "principalId" TEXT NOT NULL,
  "role" TEXT NOT NULL,
  CONSTRAINT "Membership_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE CASCADE,
  CONSTRAINT "Membership_principalId_fkey" FOREIGN KEY ("principalId") REFERENCES "Principal" ("id") ON DELETE CASCADE
);

CREATE UNIQUE INDEX "Membership_tenantId_principalId_key" ON "Membership"("tenantId", "principalId");
