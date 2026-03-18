import { describe, expect, it } from "vitest";
import { createStorageClient } from "./client";

describe("createStorageClient", () => {
  it("returns an adapter with upload and download methods", () => {
    const storage = createStorageClient({
      endpoint: "http://localhost:9000",
      bucket: "canvas-raw"
    });

    expect(typeof storage.putObject).toBe("function");
    expect(typeof storage.getObject).toBe("function");
  });
});
