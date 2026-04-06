import type { FastifyPluginAsync } from "fastify";
import { createDatasetStore, createImportJobStore } from "../../../../../packages/db/src/index.js";
import type { PrismaClient } from "../../../../../packages/db/src/generated/prisma/client.js";
import { streamMultipartUpload } from "./routes/upload-file";
import {
  createUploadResponseSchema,
  datasetPreviewSchema,
  datasetDetailSchema,
  datasetSummarySchema,
  messageResponseSchema
} from "../../api/schema";
import type { DatasetPreview } from "../../../../../packages/contracts/src/index.js";
import { createUploadSession } from "./routes/create-upload";
import { mapDatasetDetail } from "./routes/get-dataset";
import { mapDatasetSummary } from "./routes/list-datasets";
import { buildUploadPreview } from "./lib/build-upload-preview";

type DatasetWarning = {
  code: string;
  message?: string;
};

type DatasetModel = {
  id: string;
  tenantId: string;
  name: string;
  status: string;
  warnings: DatasetWarning[];
  uploadedByExternalUserId?: string;
  uploadedByDisplayName?: string;
  uploadedAt?: string;
  sourceFilename?: string;
  contentType?: string;
  sizeBytes?: number;
  storageBucket?: string;
  storageObjectKey?: string;
  storageUploadId?: string;
  importStatus?: string;
  usageSummary?: {
    dashboards: Array<{ id: string; name: string }>;
    widgets: Array<{
      id: string;
      dashboardId: string;
      dashboardName: string;
      type: string;
    }>;
    workbooks: Array<{ id: string; name: string }>;
  };
};

type UploadSessionModel = {
  uploadId: string;
  upload: {
    bucket: string;
    objectKey: string;
    uploadUrl: string;
  };
  dataset: DatasetModel;
};

export type DatasetsService = {
  listDatasets: (tenantId: string) => Promise<DatasetModel[]>;
  getDataset: (datasetId: string, tenantId: string) => Promise<DatasetModel | null>;
  createUpload: (input: {
    filename: string;
    name: string;
    tenantId: string;
    content?: string;
    contentType?: string;
    sizeBytes?: number;
    uploadedByExternalUserId?: string;
    uploadedByDisplayName?: string;
  }) => Promise<UploadSessionModel>;
  getDatasetPreview: (input: {
    datasetId: string;
    tenantId: string;
  }) => Promise<DatasetPreview | null>;
  uploadFile: (input: {
    uploadId: string;
    tenantId: string;
    contentType?: string;
    body: AsyncIterable<string | Buffer>;
  }) => Promise<{
    uploadId: string;
    datasetId: string;
    bucket: string;
    objectKey: string;
    sizeBytes: number;
    importStatus: string;
  }>;
};

export type DatasetsModuleOptions = {
  datasets: DatasetsService;
};

type CreateDatasetsServiceInput = {
  db: PrismaClient;
  tenantId: string;
  multipartUploads?: {
    create: (input: {
      bucket: string;
      key: string;
      contentType?: string;
    }) => Promise<{
      bucket: string;
      key: string;
      uploadId: string;
    }>;
    uploadPart: (input: {
      bucket: string;
      key: string;
      uploadId: string;
      partNumber: number;
      body: Buffer;
    }) => Promise<{
      etag: string;
      partNumber: number;
    }>;
    complete: (input: {
      bucket: string;
      key: string;
      uploadId: string;
      parts: Array<{
        etag: string;
        partNumber: number;
      }>;
    }) => Promise<{
      bucket: string;
      key: string;
    }>;
    abort: (input: {
      bucket: string;
      key: string;
      uploadId: string;
    }) => Promise<void>;
  };
  storageBucket?: string;
  uploadPartSizeBytes?: number;
};

export function createDatasetsService(
  input: CreateDatasetsServiceInput
): DatasetsService {
  const datasets = createDatasetStore(input.db);
  const importJobs = createImportJobStore(input.db);

  return {
    listDatasets(tenantId: string) {
      return datasets.listByTenant(tenantId);
    },
    getDataset(datasetId: string, tenantId: string) {
      return (async () => {
        const dataset = await datasets.findByTenantAndId(tenantId, datasetId);

        if (!dataset) {
          return null;
        }

        const usageSummary = await datasets.findUsageByTenantAndId(
          tenantId,
          datasetId
        );

        return {
          ...dataset,
          usageSummary:
            usageSummary ?? {
              dashboards: [],
              widgets: [],
              workbooks: []
            }
        };
      })();
    },
    async createUpload(uploadInput: {
      filename: string;
      name: string;
      tenantId: string;
      content?: string;
      contentType?: string;
      sizeBytes?: number;
      uploadedByExternalUserId?: string;
      uploadedByDisplayName?: string;
    }) {
      const dataset = await datasets.create({
        tenantId: uploadInput.tenantId,
        name: uploadInput.name,
        uploadedByExternalUserId: uploadInput.uploadedByExternalUserId,
        uploadedByDisplayName: uploadInput.uploadedByDisplayName,
        uploadedAt: new Date(),
        sourceFilename: uploadInput.filename,
        contentType: uploadInput.contentType,
        sizeBytes: uploadInput.sizeBytes,
        importStatus: "queued"
      });

      const preview = buildUploadPreview({
        datasetId: dataset.id,
        filename: uploadInput.filename,
        content: uploadInput.content
      });

      if (preview) {
        await datasets.updatePreview({
          tenantId: uploadInput.tenantId,
          datasetId: dataset.id,
          preview
        });
      }

      const objectTarget = await createUploadSession({
        tenantId: uploadInput.tenantId,
        filename: uploadInput.filename,
        uploadId: "pending-upload-id",
        bucket: input.storageBucket ?? "canvas-raw"
      });

      const importJob = await importJobs.create({
        datasetId: dataset.id,
        tenantId: uploadInput.tenantId,
        objectKey: objectTarget.objectKey
      });

      const datasetWithUploadMetadata = {
        ...dataset,
        uploadedByExternalUserId:
          uploadInput.uploadedByExternalUserId ?? dataset.uploadedByExternalUserId,
        uploadedByDisplayName:
          uploadInput.uploadedByDisplayName ?? dataset.uploadedByDisplayName,
        sourceFilename: uploadInput.filename,
        contentType: uploadInput.contentType ?? dataset.contentType,
        sizeBytes: uploadInput.sizeBytes ?? dataset.sizeBytes,
        importStatus: dataset.importStatus ?? "queued"
      };

      const upload = await createUploadSession({
        tenantId: uploadInput.tenantId,
        filename: uploadInput.filename,
        uploadId: importJob.id,
        bucket: input.storageBucket ?? "canvas-raw"
      });

      return {
        uploadId: importJob.id,
        upload,
        dataset: datasetWithUploadMetadata
      };
    },
    async getDatasetPreview(previewInput: {
      datasetId: string;
      tenantId: string;
    }) {
      const preview = await datasets.findPreviewByTenantAndId(
        previewInput.tenantId,
        previewInput.datasetId
      );

      if (!preview) {
        return null;
      }

      return preview;
    },
    async uploadFile(uploadInput: {
      uploadId: string;
      tenantId: string;
      contentType?: string;
      body: AsyncIterable<string | Buffer>;
    }) {
      if (!input.multipartUploads) {
        throw new Error(
          `Dataset file upload is not configured for upload session ${uploadInput.uploadId}`
        );
      }

      const importJob = await importJobs.findById({
        tenantId: uploadInput.tenantId,
        importJobId: uploadInput.uploadId
      });

      if (!importJob) {
        throw new Error(
          `Dataset upload session ${uploadInput.uploadId} was not found`
        );
      }

      await importJobs.updateStatus({
        importJobId: importJob.id,
        status: "processing"
      });

      const upload = await streamMultipartUpload({
        multipartUploads: input.multipartUploads,
        bucket: input.storageBucket ?? "canvas-raw",
        objectKey: importJob.objectKey,
        contentType: uploadInput.contentType,
        partSizeBytes: input.uploadPartSizeBytes ?? 5 * 1024 * 1024,
        body: uploadInput.body
      });

      await datasets.updateStorageMetadata({
        tenantId: uploadInput.tenantId,
        datasetId: importJob.datasetId,
        contentType: uploadInput.contentType,
        sizeBytes: upload.sizeBytes,
        storageBucket: upload.bucket,
        storageObjectKey: upload.objectKey,
        storageUploadId: upload.uploadId,
        importStatus: "queued"
      });

      await importJobs.updateStatus({
        importJobId: importJob.id,
        status: "queued"
      });

      return {
        uploadId: importJob.id,
        datasetId: importJob.datasetId,
        bucket: upload.bucket,
        objectKey: upload.objectKey,
        sizeBytes: upload.sizeBytes,
        importStatus: "queued"
      };
    }
  };
}

export const datasetsModule: FastifyPluginAsync<DatasetsModuleOptions> = async (
  app,
  options
) => {
  for (const contentType of [
    "text/csv",
    "application/octet-stream",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  ]) {
    if (!app.hasContentTypeParser(contentType)) {
      app.addContentTypeParser(contentType, (_request, payload, done) => {
        done(null, payload);
      });
    }
  }

  app.get("/datasets", {
    schema: {
      tags: ["datasets"],
      summary: "List datasets for the current app",
      description:
        "Requires Authorization: Bearer <amtoken> and a valid canvas_session cookie. Returns dataset summaries for the currently selected app.",
      security: [
        {
          bearerAuth: []
        }
      ],
      response: {
        200: {
          type: "array",
          items: datasetSummarySchema
        },
        401: messageResponseSchema
      }
    }
  }, async (request, reply) => {
    if (!request.headers.authorization) {
      reply.status(401);
      return {
        message: "Missing bearer token"
      };
    }

    if (!request.tenantContext?.tenantId) {
      reply.status(401);
      return {
        message: "Missing tenant context"
      };
    }

    const datasets = await options.datasets.listDatasets(request.tenantContext.tenantId);
    return datasets.map(mapDatasetSummary);
  });

  app.get<{
    Params: {
      datasetId: string;
    };
  }>("/datasets/:datasetId", {
    schema: {
      tags: ["datasets"],
      summary: "Get one dataset",
      description:
        "Requires Authorization: Bearer <amtoken> and a valid canvas_session cookie. Returns the detailed dataset record for the current app.",
      security: [
        {
          bearerAuth: []
        }
      ],
      params: {
        type: "object",
        required: ["datasetId"],
        properties: {
          datasetId: {
            description: "Dataset identifier inside the active app.",
            type: "string"
          }
        }
      },
      response: {
        200: datasetDetailSchema,
        401: messageResponseSchema,
        404: messageResponseSchema
      }
    }
  }, async (request, reply) => {
    if (!request.headers.authorization) {
      reply.status(401);
      return {
        message: "Missing bearer token"
      };
    }

    if (!request.tenantContext?.tenantId) {
      reply.status(401);
      return {
        message: "Missing tenant context"
      };
    }

    const dataset = await options.datasets.getDataset(
      request.params.datasetId,
      request.tenantContext.tenantId
    );

    if (!dataset) {
      reply.status(404);
      return {
        message: "Dataset not found"
      };
    }

    return mapDatasetDetail(dataset);
  });

  app.get<{
    Params: {
      datasetId: string;
    };
  }>("/datasets/:datasetId/preview", {
    schema: {
      tags: ["datasets"],
      summary: "Get normalized preview data for one dataset",
      description:
        "Requires Authorization: Bearer <amtoken> and a valid canvas_session cookie. Returns normalized preview metadata used by the dashboard editor for the selected dataset.",
      security: [{ bearerAuth: [] }],
      params: {
        type: "object",
        required: ["datasetId"],
        properties: {
          datasetId: {
            description: "Dataset identifier inside the active app.",
            type: "string"
          }
        }
      },
      response: {
        200: datasetPreviewSchema,
        401: messageResponseSchema,
        404: messageResponseSchema
      }
    }
  }, async (request, reply) => {
    if (!request.headers.authorization) {
      reply.status(401);
      return {
        message: "Missing bearer token"
      };
    }

    if (!request.tenantContext?.tenantId) {
      reply.status(401);
      return {
        message: "Missing tenant context"
      };
    }

    const preview = await options.datasets.getDatasetPreview({
      datasetId: request.params.datasetId,
      tenantId: request.tenantContext.tenantId
    });

    if (!preview) {
      reply.status(404);
      return {
        message: "Dataset not found"
      };
    }

    return preview;
  });

  app.post<{
    Body: {
      filename?: string;
      name?: string;
      content?: string;
      contentType?: string;
      sizeBytes?: number;
    };
  }>("/datasets/uploads", {
    schema: {
      tags: ["datasets"],
      summary: "Create an upload session for a dataset import",
      description:
        "Requires Authorization: Bearer <amtoken> and a valid canvas_session cookie. Creates an upload target and queued dataset record in the selected app.",
      security: [
        {
          bearerAuth: []
        }
      ],
      body: {
        type: "object",
        properties: {
          filename: {
            description: "Original file name that will be stored in the upload target.",
            type: "string"
          },
          name: {
            description: "Dataset display name to create in the active app.",
            type: "string"
          },
          content: {
            description: "Optional inline CSV content used for local preview extraction.",
            type: "string"
          },
          contentType: {
            description: "Browser-reported content type for the uploaded file.",
            type: "string"
          },
          sizeBytes: {
            description: "Browser-reported file size in bytes.",
            type: "number"
          }
        }
      },
      response: {
        200: createUploadResponseSchema,
        401: messageResponseSchema
      }
    }
  }, async (request, reply) => {
    if (!request.headers.authorization) {
      reply.status(401);
      return {
        message: "Missing bearer token"
      };
    }

    if (!request.tenantContext?.tenantId) {
      reply.status(401);
      return {
        message: "Missing tenant context"
      };
    }

    const result = await options.datasets.createUpload({
      filename: request.body?.filename ?? "dataset.csv",
      name: request.body?.name ?? "Dataset Upload",
      tenantId: request.tenantContext.tenantId,
      content: request.body?.content,
      contentType: request.body?.contentType,
      sizeBytes: request.body?.sizeBytes,
      uploadedByExternalUserId: request.tenantContext.externalUserId,
      uploadedByDisplayName: request.tenantContext.displayName
    });

    return {
      uploadId: result.uploadId,
      upload: result.upload,
      dataset: mapDatasetSummary(result.dataset)
    };
  });

  app.put<{
    Params: {
      uploadId: string;
    };
  }>("/datasets/uploads/:uploadId/file", {
    schema: {
      tags: ["datasets"],
      summary: "Upload a dataset file into an existing upload session",
      description:
        "Requires Authorization: Bearer <amtoken> and a valid canvas_session cookie. Streams the request body into the selected app upload session.",
      security: [{ bearerAuth: [] }],
      params: {
        type: "object",
        required: ["uploadId"],
        properties: {
          uploadId: {
            type: "string",
            description: "Canvas upload session identifier."
          }
        }
      },
      response: {
        200: {
          type: "object",
          properties: {
            uploadId: {
              type: "string"
            },
            datasetId: {
              type: "string"
            },
            bucket: {
              type: "string"
            },
            objectKey: {
              type: "string"
            },
            sizeBytes: {
              type: "number"
            },
            importStatus: {
              type: "string"
            }
          },
          required: [
            "uploadId",
            "datasetId",
            "bucket",
            "objectKey",
            "sizeBytes",
            "importStatus"
          ]
        },
        401: messageResponseSchema
      }
    }
  }, async (request, reply) => {
    if (!request.headers.authorization) {
      reply.status(401);
      return {
        message: "Missing bearer token"
      };
    }

    if (!request.tenantContext?.tenantId) {
      reply.status(401);
      return {
        message: "Missing tenant context"
      };
    }

    return options.datasets.uploadFile({
      uploadId: request.params.uploadId,
      tenantId: request.tenantContext.tenantId,
      contentType: request.headers["content-type"],
      body: (request.body as AsyncIterable<string | Buffer>) ?? request.raw
    });
  });
};
