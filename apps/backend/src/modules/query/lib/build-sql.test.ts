import { describe, expect, it } from "vitest";
import { buildSql } from "./build-sql";

describe("buildSql", () => {
  it("creates a grouped aggregate query over DatasetRow JSON records", () => {
    const query = buildSql({
      tenantId: "canvas",
      datasetId: "ds_1",
      dimensions: ["region"],
      measures: [{ field: "amount", op: "sum" }]
    });

    expect(query).toEqual({
      text:
        `select record->>'region' as "region", ` +
        `sum((record->>'amount')::numeric) as "sum_amount" ` +
        `from "DatasetRow" where "tenantId" = $1 and "datasetId" = $2 ` +
        `group by record->>'region'`,
      values: ["canvas", "ds_1"]
    });
  });
});
