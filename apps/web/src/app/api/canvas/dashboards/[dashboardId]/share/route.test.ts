import { describe, expect, it } from "vitest";
import { POST } from "./route";

describe("canvas dashboard share demo route", () => {
  it("updates dashboard share subjects", async () => {
    const request = new Request(
      "http://localhost:3000/api/canvas/dashboards/dash_1/share",
      {
        method: "POST",
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify({
          subjects: [
            { type: "role", id: "ADMIN" },
            { type: "group", id: "finance" }
          ]
        })
      }
    );

    const response = await POST(request, {
      params: Promise.resolve({
        dashboardId: "dash_1"
      })
    });
    const payload = (await response.json()) as {
      dashboardId: string;
      rules: Array<{ subjectId: string }>;
    };

    expect(payload.dashboardId).toBe("dash_1");
    expect(payload.rules[0]?.subjectId).toBe("ADMIN");
    expect(payload.rules[1]?.subjectId).toBe("finance");
  });
});
