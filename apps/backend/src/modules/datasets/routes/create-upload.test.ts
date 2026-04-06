import { describe, expect, it } from "vitest";
import { createUploadSession } from "./create-upload";

describe("createUploadSession", () => {
  it("returns an upload id, target bucket, and backend upload endpoint", async () => {
    const result = await createUploadSession({
      tenantId: "tenant_123",
      filename: "sales.csv",
      uploadId: "job_123",
      bucket: "canvas-raw"
    });

    expect(result.objectKey).toContain("tenant_123");
    expect(result.bucket).toBe("canvas-raw");
    expect(result.uploadId).toBe("job_123");
    expect(result.uploadUrl).toBe(
      "/datasets/uploads/job_123/file"
    );
  });
});
