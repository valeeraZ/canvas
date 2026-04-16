import { describe, expect, it } from "vitest";
import { createBackendRuntimeConfig } from "./server";

describe("createBackendRuntimeConfig", () => {
  it("uses local development defaults that work with VS Code launch", () => {
    const config = createBackendRuntimeConfig({});

    expect(config.host).toBe("127.0.0.1");
    expect(config.port).toBe(3001);
    expect(config.authBaseUrl).toBe("http://auth.local");
    expect(config.appName).toBe("tenant_demo");
    expect(config.databaseUrl).toBe("postgres://canvas:canvas@localhost:5432/canvas");
    expect(config.mockContext).toEqual({
      displayName: "Local Dev",
      employeeId: "dev-1",
      roles: ["ADMIN"]
    });
  });

  it("allows environment overrides and disables mock auth when requested", () => {
    const config = createBackendRuntimeConfig({
      HOST: "0.0.0.0",
      PORT: "4400",
      AUTH_BASE_URL: "https://auth.example.com",
      CANVAS_APP_NAME: "sales",
      DATABASE_URL: "postgres://override",
      CANVAS_USE_MOCK_AUTH: "false",
      CANVAS_PRETTY_LOGS: "1"
    });

    expect(config.host).toBe("0.0.0.0");
    expect(config.port).toBe(4400);
    expect(config.authBaseUrl).toBe("https://auth.example.com");
    expect(config.appName).toBe("sales");
    expect(config.databaseUrl).toBe("postgres://override");
    expect(config.prettyLogs).toBe(true);
    expect(config.mockContext).toBeUndefined();
  });

  it("reads S3 storage settings for dataset uploads", () => {
    const config = createBackendRuntimeConfig({
      S3_ENDPOINT: "http://127.0.0.1:9000",
      S3_REGION: "us-east-1",
      S3_ACCESS_KEY_ID: "canvas-key",
      S3_SECRET_ACCESS_KEY: "canvas-secret",
      S3_BUCKET: "canvas-raw",
      S3_FORCE_PATH_STYLE: "true"
    });

    expect(config.storage).toEqual({
      endpoint: "http://127.0.0.1:9000",
      region: "us-east-1",
      accessKeyId: "canvas-key",
      secretAccessKey: "canvas-secret",
      bucket: "canvas-raw",
      forcePathStyle: true
    });
  });

  it("supports worker runtime mode selection", () => {
    const config = createBackendRuntimeConfig({
      CANVAS_RUNTIME_MODE: "worker"
    });

    expect(config.runtimeMode).toBe("worker");
  });
});
