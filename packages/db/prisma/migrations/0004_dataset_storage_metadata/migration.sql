ALTER TABLE "Dataset"
ADD COLUMN "uploadedByExternalUserId" TEXT,
ADD COLUMN "uploadedByDisplayName" TEXT,
ADD COLUMN "uploadedAt" TIMESTAMP(3),
ADD COLUMN "sourceFilename" TEXT,
ADD COLUMN "contentType" TEXT,
ADD COLUMN "sizeBytes" INTEGER,
ADD COLUMN "storageBucket" TEXT,
ADD COLUMN "storageObjectKey" TEXT,
ADD COLUMN "storageUploadId" TEXT,
ADD COLUMN "importStatus" TEXT;
