import { describe, expect, it } from "vitest";
import { buildSql } from "./build-sql";

describe("buildSql", () => {
  it("creates a grouped aggregate query", () => {
    const sql = buildSql({
      tableName: "tenant_123_sales",
      dimensions: ["region"],
      measures: [{ field: "amount", op: "sum" }]
    });

    expect(sql).toContain("group by");
    expect(sql).toContain("sum");
  });
});
