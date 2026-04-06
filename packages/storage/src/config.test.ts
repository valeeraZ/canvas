import { describe, expect, it } from "vitest";
import { readStorageConfig } from "./config";

describe("readStorageConfig", () => {
  it("reads object storage settings from environment variables", () => {
    const config = readStorageConfig({
      S3_ENDPOINT: "http://127.0.0.1:9000",
      S3_REGION: "us-east-1",
      S3_ACCESS_KEY_ID: "canvas-key",
      S3_SECRET_ACCESS_KEY: "canvas-secret",
      S3_BUCKET: "canvas-raw",
      S3_FORCE_PATH_STYLE: "true"
    });

    expect(config).toEqual({
      endpoint: "http://127.0.0.1:9000",
      region: "us-east-1",
      accessKeyId: "canvas-key",
      secretAccessKey: "canvas-secret",
      bucket: "canvas-raw",
      forcePathStyle: true
    });
  });

  it("defaults forcePathStyle to false when omitted", () => {
    const config = readStorageConfig({
      S3_ENDPOINT: "http://127.0.0.1:9000",
      S3_REGION: "us-east-1",
      S3_ACCESS_KEY_ID: "canvas-key",
      S3_SECRET_ACCESS_KEY: "canvas-secret",
      S3_BUCKET: "canvas-raw"
    });

    expect(config.forcePathStyle).toBe(false);
  });
});
