import type { FastifyPluginAsync } from "fastify";
import { createDatasetStore, createImportJobStore } from "../../../../../packages/db/src/index.js";
import type { PrismaClient } from "../../../../../packages/db/src/generated/prisma/client.js";
import {
  createUploadResponseSchema,
  datasetDetailSchema,
  datasetSummarySchema,
  messageResponseSchema
} from "../../api/schema";
import { createUploadSession } from "./routes/create-upload";
import { mapDatasetDetail } from "./routes/get-dataset";
import { mapDatasetSummary } from "./routes/list-datasets";

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
};

type UploadSessionModel = {
  upload: {
    bucket: string;
    objectKey: string;
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
  }) => Promise<UploadSessionModel>;
};

export type DatasetsModuleOptions = {
  datasets: DatasetsService;
};

type CreateDatasetsServiceInput = {
  db: PrismaClient;
  tenantId: string;
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
      return datasets.findByTenantAndId(tenantId, datasetId);
    },
    async createUpload(uploadInput: {
      filename: string;
      name: string;
      tenantId: string;
    }) {
      const dataset = await datasets.create({
        tenantId: uploadInput.tenantId,
        name: uploadInput.name
      });
      const upload = await createUploadSession({
        tenantId: uploadInput.tenantId,
        filename: uploadInput.filename
      });

      await importJobs.create({
        datasetId: dataset.id,
        tenantId: uploadInput.tenantId,
        objectKey: upload.objectKey
      });

      return {
        upload,
        dataset
      };
    }
  };
}

export const datasetsModule: FastifyPluginAsync<DatasetsModuleOptions> = async (
  app,
  options
) => {
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

  app.post<{
    Body: {
      filename?: string;
      name?: string;
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
      tenantId: request.tenantContext.tenantId
    });

    return {
      upload: result.upload,
      dataset: mapDatasetSummary(result.dataset)
    };
  });
};
