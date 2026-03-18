import { describe, expect, it, vi } from "vitest";
import { exchangeHostAssertion } from "./exchange-session";

describe("exchangeHostAssertion", () => {
  it("creates a canvas access token from upstream authorization APIs", async () => {
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
      fetchImpl
    });

    expect(result.accessToken).toContain("emp-42");
    expect(result.expiresIn).toBe(900);
    expect(result.principal.displayName).toBe("Ada Lovelace");
    expect(result.principal.roles).toEqual(["USER", "ADMIN"]);
  });
});
