import { describe, expect, it, vi } from "vitest";
import { fetchAuthorizationContext } from "./authorization-api";

describe("fetchAuthorizationContext", () => {
  it("loads current user and app roles with bearer auth", async () => {
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

    const result = await fetchAuthorizationContext({
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
      "https://auth.internal/v1/authorization/roles/canvas",
      {
        headers: {
          Authorization: "Bearer token-123"
        }
      }
    );
  });
});
