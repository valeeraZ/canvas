import { describe, expect, it } from "vitest";
import { createUploadSession } from "./create-upload";

describe("createUploadSession", () => {
  it("returns an upload key and target bucket", async () => {
    const result = await createUploadSession({
      tenantId: "tenant_123",
      filename: "sales.csv"
    });

    expect(result.objectKey).toContain("tenant_123");
    expect(result.bucket).toBeDefined();
  });
});
