import { createUploadSession } from "../../../../../../backend/src/modules/datasets/routes/create-upload";
import { finalizeUpload } from "../../../../../../backend/src/modules/datasets/routes/finalize-upload";
import { mapDatasetSummary } from "../../../../../../backend/src/modules/datasets/routes/list-datasets";
import { runImportJob } from "../../../../../../backend/src/worker/handlers/run-import-job";
import { normalizeRows } from "../../../../../../backend/src/modules/ingestion/normalize/normalize-rows";

type DemoDataset = {
  id: string;
  name: string;
  status: string;
  warnings: Array<{ code: string }>;
};

type IngestionDemoStore = {
  datasets: DemoDataset[];
  datasetCounter: number;
};

declare global {
  var __canvasIngestionDemoStore: IngestionDemoStore | undefined;
}

function getStore(): IngestionDemoStore {
  if (!globalThis.__canvasIngestionDemoStore) {
    globalThis.__canvasIngestionDemoStore = {
      datasets: [],
      datasetCounter: 1
    };
  }

  return globalThis.__canvasIngestionDemoStore;
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    filename?: string;
    name?: string;
  };

  const tenantId = "tenant_demo";
  const filename = body.filename ?? "dataset.csv";
  const name = body.name ?? "Dataset Upload";
  const store = getStore();
  const datasetId = `ds_${store.datasetCounter++}`;

  const upload = await createUploadSession({
    tenantId,
    filename
  });

  const finalized = await finalizeUpload({
    tenantId,
    datasetId,
    objectKey: upload.objectKey
  });

  const importJob = await runImportJob({
    tenantId: finalized.tenantId,
    datasetId: finalized.datasetId,
    objectKey: finalized.objectKey
  });

  normalizeRows({
    headers: [" Order Date ", "Amount"],
    rows: [["2026-03-01", "42"], ["2026-03-02", "18"]]
  });

  const dataset: DemoDataset = {
    id: importJob.datasetId,
    name,
    status: "ready",
    warnings: []
  };
  store.datasets.unshift(dataset);

  return Response.json({
    upload,
    dataset: mapDatasetSummary(dataset)
  });
}

export async function GET() {
  const store = getStore();
  return Response.json(store.datasets.map((item) => mapDatasetSummary(item)));
}
