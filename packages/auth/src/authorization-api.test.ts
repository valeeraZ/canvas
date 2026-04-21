import { describe, expect, it, vi } from "vitest";
import * as authorizationApi from "./authorization-api";

describe("fetchAuthorizationContext", () => {
  it("loads current user and resolves app roles from the accessible app list", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            display_name: "Ada Lovelace",
            employee_id: "emp-42"
          }),
          { status: 200 }
        )
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify([
            {
              app_name: "canvas",
              roles: ["USER", "ADMIN"]
            },
            {
              app_name: "canvas-ops",
              roles: ["USER"]
            }
          ]),
          { status: 200 }
        )
      );

    const result = await authorizationApi.fetchAuthorizationContext({
      authBaseUrl: "https://auth.internal",
      token: "token-123",
      appName: "canvas",
      fetchImpl
    });

    expect(result.displayName).toBe("Ada Lovelace");
    expect(result.employeeId).toBe("emp-42");
    expect(result.roles).toEqual(["USER", "ADMIN"]);
    expect(fetchImpl).toHaveBeenNthCalledWith(
      1,
      "https://auth.internal/v1/authorization/current_user",
      {
        headers: {
          Authorization: "Bearer token-123"
        }
      }
    );
    expect(fetchImpl).toHaveBeenNthCalledWith(
      2,
      "https://auth.internal/v1/authorization/roles",
      {
        headers: {
          Authorization: "Bearer token-123"
        }
      }
    );
  });

  it("loads the full accessible app list with bearer auth", async () => {
    const fetchImpl = vi.fn().mockResolvedValueOnce(
      new Response(
        JSON.stringify([
          {
            app_name: "canvas",
            roles: ["ADMIN"]
          },
          {
            app_name: "canvas-ops",
            roles: ["USER"]
          }
        ]),
        { status: 200 }
      )
    );

    const result = await (authorizationApi as typeof authorizationApi & {
      fetchAccessibleApps: (input: {
        authBaseUrl: string;
        token: string;
        fetchImpl: typeof fetch;
      }) => Promise<Array<{ appName: string; roles: string[] }>>;
    }).fetchAccessibleApps({
      authBaseUrl: "https://auth.internal",
      token: "token-123",
      fetchImpl
    });

    expect(result).toEqual([
      {
        appName: "canvas",
        roles: ["ADMIN"]
      },
      {
        appName: "canvas-ops",
        roles: ["USER"]
      }
    ]);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(fetchImpl).toHaveBeenCalledWith(
      "https://auth.internal/v1/authorization/roles",
      {
        headers: {
          Authorization: "Bearer token-123"
        }
      }
    );
  });

  it("loads accessible apps from nested auth roles payloads", async () => {
    const fetchImpl = vi.fn().mockResolvedValueOnce(
      new Response(
        JSON.stringify([
          {
            app_name: "frame_app",
            roles: {
              roles: ["ADMIN", "USER"]
            }
          },
          {
            app_name: "other_app",
            roles: {
              roles: []
            }
          }
        ]),
        { status: 200 }
      )
    );

    const result = await (authorizationApi as typeof authorizationApi & {
      fetchAccessibleApps: (input: {
        authBaseUrl: string;
        token: string;
        fetchImpl: typeof fetch;
      }) => Promise<Array<{ appName: string; roles: string[] }>>;
    }).fetchAccessibleApps({
      authBaseUrl: "https://auth.internal",
      token: "token-123",
      fetchImpl
    });

    expect(result).toEqual([
      {
        appName: "frame_app",
        roles: ["ADMIN", "USER"]
      }
    ]);
  });

  it("filters apps with no resolved roles from the accessible app list", async () => {
    const fetchImpl = vi.fn().mockResolvedValueOnce(
      new Response(
        JSON.stringify([
          {
            app_name: "canvas",
            roles: ["ADMIN"]
          },
          {
            app_name: "canvas-empty",
            roles: []
          }
        ]),
        { status: 200 }
      )
    );

    const result = await (authorizationApi as typeof authorizationApi & {
      fetchAccessibleApps: (input: {
        authBaseUrl: string;
        token: string;
        fetchImpl: typeof fetch;
      }) => Promise<Array<{ appName: string; roles: string[] }>>;
    }).fetchAccessibleApps({
      authBaseUrl: "https://auth.internal",
      token: "token-123",
      fetchImpl
    });

    expect(result).toEqual([
      {
        appName: "canvas",
        roles: ["ADMIN"]
      }
    ]);
  });

  it("loads app metadata from the auth app endpoint", async () => {
    const fetchImpl = vi.fn().mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          app_name: "frame_app",
          app_display_name: "FRAME App",
          app_logo_name: "app-window"
        }),
        { status: 200 }
      )
    );

    const result = await (authorizationApi as typeof authorizationApi & {
      fetchAppMetadata: (input: {
        authBaseUrl: string;
        token: string;
        appName: string;
        fetchImpl: typeof fetch;
      }) => Promise<{
        appName: string;
        appDisplayName: string;
        appLogoName: string;
      }>;
    }).fetchAppMetadata({
      authBaseUrl: "https://auth.internal",
      token: "token-123",
      appName: "frame_app",
      fetchImpl
    });

    expect(result).toEqual({
      appName: "frame_app",
      appDisplayName: "FRAME App",
      appLogoName: "app-window"
    });
    expect(fetchImpl).toHaveBeenCalledWith(
      "https://auth.internal/v1/app/frame_app",
      {
        headers: {
          Authorization: "Bearer token-123"
        }
      }
    );
  });

  it("supports local mock context without calling external endpoints", async () => {
    const fetchImpl = vi.fn();

    const result = await authorizationApi.fetchAuthorizationContext({
      authBaseUrl: "https://auth.internal",
      token: "token-123",
      appName: "canvas",
      fetchImpl,
      mockContext: {
        displayName: "Local Dev",
        employeeId: "dev-1",
        roles: ["ADMIN"]
      }
    });

    expect(result).toEqual({
      displayName: "Local Dev",
      employeeId: "dev-1",
      roles: ["ADMIN"]
    });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("rejects authorization for an app outside the accessible app list", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            display_name: "Ada Lovelace",
            employee_id: "emp-42"
          }),
          { status: 200 }
        )
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify([
            {
              app_name: "canvas-ops",
              roles: ["USER"]
            }
          ]),
          { status: 200 }
        )
      );

    await expect(
      authorizationApi.fetchAuthorizationContext({
        authBaseUrl: "https://auth.internal",
        token: "token-123",
        appName: "canvas",
        fetchImpl
      })
    ).rejects.toThrow("App is not accessible to the current principal");
  });
});
