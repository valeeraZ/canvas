import { afterEach, describe, expect, it } from "vitest";
import { createApiApp } from "../../api/app";

const apps: Array<ReturnType<typeof createApiApp>> = [];

afterEach(async () => {
  while (apps.length > 0) {
    await apps.pop()?.close();
  }
});

describe("auth routes", () => {
  it("returns tenant context for a valid canvas token", async () => {
    const app = createApiApp({
      authBaseUrl: "http://auth.local",
      mockContext: {
        displayName: "Local Dev",
        employeeId: "dev-1",
        roles: ["ADMIN"]
      }
    });

    apps.push(app);

    const session = await app.inject({
      method: "POST",
      url: "/session/exchange",
      payload: {
        token: "local-dev-token",
        appName: "canvas"
      }
    });

    const auth = await app.inject({
      method: "GET",
      url: "/auth/me",
      headers: {
        authorization: `Bearer ${session.json().accessToken as string}`
      }
    });

    expect(auth.statusCode).toBe(200);
    expect(auth.json().tenantId).toBe("canvas");
    expect(auth.json().roles).toContain("ADMIN");
  });

  it("switches app context and mints a new access token", async () => {
    const app = createApiApp({
      authBaseUrl: "http://auth.local",
      mockContext: {
        displayName: "Local Dev",
        employeeId: "dev-1",
        roles: ["ADMIN"]
      }
    });

    apps.push(app);

    const session = await app.inject({
      method: "POST",
      url: "/session/exchange",
      payload: {
        token: "local-dev-token",
        appName: "canvas"
      }
    });

    const switched = await app.inject({
      method: "POST",
      url: "/auth/select-app",
      headers: {
        authorization: `Bearer ${session.json().accessToken as string}`
      },
      payload: {
        appName: "canvas-ops"
      }
    });

    expect(switched.statusCode).toBe(200);
    expect(switched.json().tenantId).toBe("canvas-ops");
    expect(switched.json().accessToken).toContain("canvas.canvas-ops.dev-1.");
  });
});
