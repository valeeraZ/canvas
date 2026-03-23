import { describe, expect, it, vi } from "vitest";
import {
  getSelectedDashboard,
  setSelectedDashboard
} from "./use-selected-dashboard";

describe("selected dashboard hooks", () => {
  it("reads and updates selected dashboard through the api client", async () => {
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
  });
});
