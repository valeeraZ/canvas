import { describe, expect, it } from "vitest";
import { POST } from "./route";

describe("canvas session route", () => {
  it("returns a mock session for local development", async () => {
    const request = new Request("http://localhost:3000/api/canvas/session", {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({
        appName: "canvas"
      })
    });

    const response = await POST(request);
    const payload = (await response.json()) as {
      accessToken: string;
      principal: {
        displayName: string;
        employeeId: string;
      };
    };

    expect(payload.accessToken).toContain("dev-1");
    expect(payload.principal.displayName).toBe("Local Dev");
    expect(payload.principal.employeeId).toBe("dev-1");
  });
});
