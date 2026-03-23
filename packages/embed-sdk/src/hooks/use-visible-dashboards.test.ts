import { describe, expect, it, vi } from "vitest";
import { listVisibleDashboards } from "./use-visible-dashboards";

describe("listVisibleDashboards", () => {
  it("delegates to the viewer api client", async () => {
    const fetcher = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          dashboards: [{ id: "dash_1", name: "Executive Overview" }]
        }),
        { status: 200 }
      )
    );

    const result = await listVisibleDashboards({
      fetchImpl: fetcher,
      baseUrl: "http://localhost:3000"
    });

    expect(result[0]?.name).toBe("Executive Overview");
  });
});
