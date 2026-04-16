CREATE TABLE "DatasetRow" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "datasetId" TEXT NOT NULL,
  "rowIndex" INTEGER NOT NULL,
  "record" JSONB NOT NULL,

  CONSTRAINT "DatasetRow_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "DatasetRow_datasetId_rowIndex_key"
ON "DatasetRow"("datasetId", "rowIndex");

CREATE INDEX "DatasetRow_tenantId_datasetId_rowIndex_idx"
ON "DatasetRow"("tenantId", "datasetId", "rowIndex");

ALTER TABLE "DatasetRow"
ADD CONSTRAINT "DatasetRow_datasetId_fkey"
FOREIGN KEY ("datasetId") REFERENCES "Dataset"("id") ON DELETE CASCADE ON UPDATE CASCADE;
