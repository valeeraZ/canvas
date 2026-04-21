import { afterEach, describe, expect, it } from "vitest";
import { createApiApp } from "../../api/app";

const apps: Array<ReturnType<typeof createApiApp>> = [];

function readSessionCookie(value: string | string[] | undefined) {
  if (!value) {
    return "";
  }

  const cookie = Array.isArray(value) ? value[0] : value;
  return cookie.split(";")[0] ?? "";
}

afterEach(async () => {
  while (apps.length > 0) {
    await apps.pop()?.close();
  }
});

describe("auth routes", () => {
  it("returns 401 json when tenant context is missing", async () => {
    const app = createApiApp({
      authBaseUrl: "http://auth.local",
      mockContext: {
        displayName: "Local Dev",
        employeeId: "dev-1",
        roles: ["ADMIN"]
      }
    });

    apps.push(app);

    const auth = await app.inject({
      method: "GET",
      url: "/auth/me"
    });

    expect(auth.statusCode).toBe(401);
    expect(auth.json()).toEqual({
      message: "Missing bearer token"
    });
  });

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
        authorization: "Bearer local-dev-token",
        cookie: readSessionCookie(session.headers["set-cookie"])
      }
    });

    expect(auth.statusCode).toBe(200);
    expect(auth.json().tenantId).toBe("canvas");
    expect(auth.json().displayName).toBe("Local Dev");
    expect(auth.json().externalUserId).toBe("dev-1");
    expect(auth.json().roles).toContain("ADMIN");
  });

  it("lists accessible apps for a valid amtoken", async () => {
    const app = createApiApp({
      authBaseUrl: "http://auth.local",
      mockContext: {
        displayName: "Local Dev",
        employeeId: "dev-1",
        roles: ["ADMIN"]
      },
      mockAccessibleApps: [
        {
          appName: "canvas",
          roles: ["ADMIN"]
        },
        {
          appName: "canvas-ops",
          roles: ["USER"]
        }
      ]
    });

    apps.push(app);

    const response = await app.inject({
      method: "GET",
      url: "/auth/apps",
      headers: {
        authorization: "Bearer local-dev-token"
      }
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      principal: {
        displayName: "Local Dev",
        employeeId: "dev-1"
      },
      apps: [
        {
          appName: "canvas",
          appDisplayName: "canvas",
          appLogoName: "app-window",
          roles: ["ADMIN"]
        },
        {
          appName: "canvas-ops",
          appDisplayName: "canvas-ops",
          appLogoName: "app-window",
          roles: ["USER"]
        }
      ]
    });
  });

  it("does not list apps without resolved roles", async () => {
    const app = createApiApp({
      authBaseUrl: "http://auth.local",
      mockContext: {
        displayName: "Local Dev",
        employeeId: "dev-1",
        roles: ["ADMIN"]
      },
      mockAccessibleApps: [
        {
          appName: "canvas",
          roles: ["ADMIN"]
        },
        {
          appName: "canvas-empty",
          roles: []
        }
      ]
    });

    apps.push(app);

    const response = await app.inject({
      method: "GET",
      url: "/auth/apps",
      headers: {
        authorization: "Bearer local-dev-token"
      }
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().apps).toEqual([
      {
        appName: "canvas",
        appDisplayName: "canvas",
        appLogoName: "app-window",
        roles: ["ADMIN"]
      }
    ]);
  });

  it("does not list apps without resolved roles from a cached resolver result", async () => {
    const app = createApiApp({
      authBaseUrl: "http://auth.local",
      mockContext: {
        displayName: "Local Dev",
        employeeId: "dev-1",
        roles: ["ADMIN"]
      },
      authorizationResolver: {
        async getPrincipal() {
          return {
            displayName: "Local Dev",
            employeeId: "dev-1"
          };
        },
        async listAccessibleApps() {
          return [
            {
              appName: "canvas",
              roles: ["ADMIN"]
            },
            {
              appName: "other_app",
              roles: []
            }
          ];
        },
        async resolve() {
          return {
            appName: "canvas",
            displayName: "Local Dev",
            employeeId: "dev-1",
            roles: ["ADMIN"],
            groups: []
          };
        }
      }
    });

    apps.push(app);

    const response = await app.inject({
      method: "GET",
      url: "/auth/apps",
      headers: {
        authorization: "Bearer local-dev-token"
      }
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().apps).toEqual([
      {
        appName: "canvas",
        appDisplayName: "canvas",
        appLogoName: "app-window",
        roles: ["ADMIN"]
      }
    ]);
  });

  it("switches app context in the canvas session", async () => {
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
        authorization: "Bearer local-dev-token",
        cookie: readSessionCookie(session.headers["set-cookie"])
      },
      payload: {
        appName: "canvas-ops"
      }
    });

    expect(switched.statusCode).toBe(200);
    expect(switched.json().tenantId).toBe("canvas-ops");
    expect(switched.json().roles).toContain("ADMIN");
  });
});
