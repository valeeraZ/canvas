import { describe, expect, it } from "vitest";
import { createDatasetsService } from "./app";

describe("createDatasetsService", () => {
  it("builds the dataset service API around the configured database client", () => {
    const service = createDatasetsService({
      db: {} as never,
      tenantId: "canvas"
    });

    expect(typeof service.createUpload).toBe("function");
    expect(typeof service.uploadFile).toBe("function");
    expect(typeof service.listDatasets).toBe("function");
    expect(typeof service.getDataset).toBe("function");
    expect(typeof service.runChartQuery).toBe("function");
    expect(typeof service.getDatasetRowsPage).toBe("function");
  });
});
