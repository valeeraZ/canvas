import { describe, expect, it, vi } from "vitest";
import { runQuery } from "./run-query";

describe("runQuery", () => {
  it("executes a grouped aggregate query against DatasetRow records", async () => {
    const db = {
      $queryRawUnsafe: vi.fn(async () => [
        {
          region: "APAC",
          sum_amount: 42
        }
      ])
    };

    const result = await runQuery({
      db,
      tenantId: "canvas",
      datasetId: "ds_1",
      allowedFields: ["region", "amount"],
      dimensions: ["region"],
      measures: [{ field: "amount", op: "sum" }]
    });

    expect(db.$queryRawUnsafe).toHaveBeenCalledWith(
      `select record->>'region' as "region", ` +
        `sum((record->>'amount')::numeric) as "sum_amount" ` +
        `from "DatasetRow" where "tenantId" = $1 and "datasetId" = $2 ` +
        `group by record->>'region'`,
      "canvas",
      "ds_1"
    );
    expect(result.rows).toEqual([
      {
        region: "APAC",
        sum_amount: 42
      }
    ]);
  });

  it("rejects dimensions and measures that are not in the allowed field list", async () => {
    await expect(
      runQuery({
        db: {
          $queryRawUnsafe: vi.fn(async () => [])
        },
        tenantId: "canvas",
        datasetId: "ds_1",
        allowedFields: ["amount"],
        dimensions: ["region"],
        measures: [{ field: "amount", op: "sum" }]
      })
    ).rejects.toThrow('Query field "region" is not available on dataset ds_1');
  });
});
