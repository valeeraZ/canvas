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
      CANVAS_USE_MOCK_AUTH: "false"
    });

    expect(config.host).toBe("0.0.0.0");
    expect(config.port).toBe(4400);
    expect(config.authBaseUrl).toBe("https://auth.example.com");
    expect(config.appName).toBe("sales");
    expect(config.databaseUrl).toBe("postgres://override");
    expect(config.mockContext).toBeUndefined();
  });
});
