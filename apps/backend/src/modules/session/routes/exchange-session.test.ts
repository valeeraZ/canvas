import { describe, expect, it, vi } from "vitest";
import { exchangeHostAssertion } from "./exchange-session";

describe("exchangeHostAssertion", () => {
  it("creates a Canvas server session payload from upstream authorization APIs", async () => {
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
        new Response(JSON.stringify({ roles: ["USER", "ADMIN"] }), { status: 200 })
      );

    const result = await exchangeHostAssertion({
      authBaseUrl: "https://auth.internal",
      token: "token-123",
      appName: "canvas",
      authorizationResolver: {
        resolve: async () => ({
          appName: "canvas",
          displayName: "Ada Lovelace",
          employeeId: "emp-42",
          roles: ["USER", "ADMIN"],
          groups: []
        })
      }
    });

    expect(result.selectedApp).toBe("canvas");
    expect(result.expiresIn).toBe(1800);
    expect(result.principal.displayName).toBe("Ada Lovelace");
    expect(result.principal.roles).toEqual(["USER", "ADMIN"]);
    expect(fetchImpl).toHaveBeenCalledTimes(0);
  });

  it("can issue a session from local mock auth data", async () => {
    const result = await exchangeHostAssertion({
      authBaseUrl: "https://auth.internal",
      token: "token-123",
      appName: "canvas",
      authorizationResolver: {
        resolve: async () => ({
          appName: "canvas",
          displayName: "Local Dev",
          employeeId: "dev-1",
          roles: ["ADMIN"],
          groups: []
        })
      },
      mockContext: {
        displayName: "Local Dev",
        employeeId: "dev-1",
        roles: ["ADMIN"]
      }
    });

    expect(result.selectedApp).toBe("canvas");
    expect(result.principal.roles).toEqual(["ADMIN"]);
  });
});
