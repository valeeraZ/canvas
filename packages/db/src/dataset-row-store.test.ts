import { describe, expect, it } from "vitest";
import { createDatasetRowStore } from "./dataset-row-store";

describe("createDatasetRowStore", () => {
  it("exposes row persistence operations", () => {
    const store = createDatasetRowStore({} as never);

    expect(typeof store.replaceRows).toBe("function");
    expect(typeof store.listByDataset).toBe("function");
    expect(typeof store.listPageByDataset).toBe("function");
  });
});
