import { describe, expect, it } from "vitest";
import { toWorkbookRecord } from "./workbook-store";

describe("toWorkbookRecord", () => {
  it("normalizes a persisted workbook", () => {
    const workbook = toWorkbookRecord({
      id: "wb_1",
      tenantId: "tenant_demo",
      name: "Sales Workbook"
    });

    expect(workbook.name).toBe("Sales Workbook");
  });
});
