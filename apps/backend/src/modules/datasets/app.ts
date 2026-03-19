import type { FastifyPluginAsync } from "fastify";
import { createDatasetStore, createImportJobStore } from "../../../../../packages/db/src";
import type { PrismaClient } from "../../../../../packages/db/src/generated/prisma/client";
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
  listDatasets: () => Promise<DatasetModel[]>;
  getDataset: (datasetId: string) => Promise<DatasetModel | null>;
  createUpload: (input: {
    filename: string;
    name: string;
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
    listDatasets() {
      return datasets.listByTenant(input.tenantId);
    },
    getDataset(datasetId: string) {
      return datasets.findByTenantAndId(input.tenantId, datasetId);
    },
    async createUpload(uploadInput: { filename: string; name: string }) {
      const dataset = await datasets.create({
        tenantId: input.tenantId,
        name: uploadInput.name
      });
      const upload = await createUploadSession({
        tenantId: input.tenantId,
        filename: uploadInput.filename
      });

      await importJobs.create({
        datasetId: dataset.id,
        tenantId: input.tenantId,
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
  app.get("/datasets", async () => {
    const datasets = await options.datasets.listDatasets();
    return datasets.map(mapDatasetSummary);
  });

  app.get<{
    Params: {
      datasetId: string;
    };
  }>("/datasets/:datasetId", async (request, reply) => {
    const dataset = await options.datasets.getDataset(request.params.datasetId);

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
  }>("/datasets/uploads", async (request) => {
    const result = await options.datasets.createUpload({
      filename: request.body?.filename ?? "dataset.csv",
      name: request.body?.name ?? "Dataset Upload"
    });

    return {
      upload: result.upload,
      dataset: mapDatasetSummary(result.dataset)
    };
  });
};
