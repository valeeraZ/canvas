import { describe, expect, it, vi } from "vitest";
import {
  getSelectedDashboard,
  listVisibleDashboards,
  setSelectedDashboard
} from "./api-client";

describe("embed viewer api client", () => {
  it("lists visible dashboards from the portal-facing demo endpoint", async () => {
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

    expect(fetcher).toHaveBeenCalledWith(
      "http://localhost:3000/api/canvas/dashboards"
    );
    expect(result[0]?.id).toBe("dash_1");
  });

  it("reads and writes selected dashboard against the selected-dashboard endpoint", async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ dashboardId: "dash_1" }), { status: 200 })
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ dashboardId: "dash_2" }), { status: 200 })
      );

    const selected = await getSelectedDashboard({
      fetchImpl: fetcher,
      baseUrl: "http://localhost:3000"
    });
    const updated = await setSelectedDashboard({
      fetchImpl: fetcher,
      baseUrl: "http://localhost:3000",
      dashboardId: "dash_2"
    });

    expect(selected.dashboardId).toBe("dash_1");
    expect(updated.dashboardId).toBe("dash_2");
    expect(fetcher).toHaveBeenLastCalledWith(
      "http://localhost:3000/api/canvas/dashboards/selected-dashboard",
      expect.objectContaining({
        method: "POST"
      })
    );
  });
});
