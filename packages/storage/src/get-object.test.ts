import { describe, expect, it, vi } from "vitest";
import {
  createObjectReader,
  type StorageObjectReaderDriver
} from "./get-object";

describe("createObjectReader", () => {
  it("reads an object body through the driver", async () => {
    const driver: StorageObjectReaderDriver = {
      getObject: vi.fn(async () => ({
        bucket: "canvas-raw",
        key: "canvas/uploads/sales.csv",
        body: Buffer.from("month,revenue\nJan,120")
      }))
    };

    const reader = createObjectReader(driver);
    const object = await reader.read({
      bucket: "canvas-raw",
      key: "canvas/uploads/sales.csv"
    });

    expect(driver.getObject).toHaveBeenCalledWith({
      bucket: "canvas-raw",
      key: "canvas/uploads/sales.csv"
    });
    expect(object.body.toString("utf8")).toContain("month,revenue");
  });
});
