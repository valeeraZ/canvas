import { describe, expect, it, vi } from "vitest";
import { createDatasetContentLoader } from "./dataset-content-cache";

describe("createDatasetContentLoader", () => {
  it("hydrates parsed dataset rows from object storage and reuses the cache", async () => {
    const cache = {
      get: vi.fn(async () => null),
      set: vi.fn(async () => undefined),
      delete: vi.fn(async () => undefined)
    };
    const objectReader = {
      read: vi.fn(async () => ({
        bucket: "canvas-raw",
        key: "canvas/uploads/sales.csv",
        body: Buffer.from("Region,Amount\nAPAC,42\nEMEA,18")
      }))
    };
    const loader = createDatasetContentLoader({
      cache,
      objectReader
    });

    const input = {
      tenantId: "canvas",
      datasetId: "ds_1",
      bucket: "canvas-raw",
      objectKey: "canvas/uploads/sales.csv"
    };
    const first = await loader.load(input);

    expect(first.rows).toEqual([
      { region: "APAC", amount: 42 },
      { region: "EMEA", amount: 18 }
    ]);
    expect(objectReader.read).toHaveBeenCalledOnce();
    expect(cache.set).toHaveBeenCalledWith(
      "canvas:dataset-content:canvas:ds_1:canvas/uploads/sales.csv",
      JSON.stringify(first),
      900
    );

    cache.get.mockResolvedValueOnce(JSON.stringify(first));
    const second = await loader.load(input);

    expect(second).toEqual(first);
    expect(objectReader.read).toHaveBeenCalledOnce();
  });

  it("deduplicates concurrent hydration for the same dataset object", async () => {
    const cache = {
      get: vi.fn(async () => null),
      set: vi.fn(async () => undefined),
      delete: vi.fn(async () => undefined)
    };
    const objectReader = {
      read: vi.fn(
        async () =>
          new Promise<{
            bucket: string;
            key: string;
            body: Buffer;
          }>((resolve) => {
            setTimeout(() => {
              resolve({
                bucket: "canvas-raw",
                key: "canvas/uploads/sales.csv",
                body: Buffer.from("Region,Amount\nAPAC,42")
              });
            }, 0);
          })
      )
    };
    const loader = createDatasetContentLoader({
      cache,
      objectReader
    });
    const input = {
      tenantId: "canvas",
      datasetId: "ds_1",
      bucket: "canvas-raw",
      objectKey: "canvas/uploads/sales.csv"
    };

    const [left, right] = await Promise.all([
      loader.load(input),
      loader.load(input)
    ]);

    expect(left).toEqual(right);
    expect(objectReader.read).toHaveBeenCalledOnce();
  });
});
