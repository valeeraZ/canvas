import { describe, expect, it } from "vitest";
import { GET, POST } from "./route";

describe("canvas selected dashboard demo route", () => {
  it("reads and updates the selected dashboard", async () => {
    const initial = await GET();
    const initialPayload = (await initial.json()) as {
      dashboardId: string | null;
    };

    expect(initialPayload.dashboardId).toBe("dash_1");

    const request = new Request(
      "http://localhost:3000/api/canvas/dashboards/selected-dashboard",
      {
        method: "POST",
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify({
          dashboardId: "dash_2"
        })
      }
    );

    const updated = await POST(request);
    const updatedPayload = (await updated.json()) as {
      dashboardId: string | null;
    };

    expect(updatedPayload.dashboardId).toBe("dash_2");
  });
});
