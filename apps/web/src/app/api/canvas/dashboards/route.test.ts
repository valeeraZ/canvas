import { describe, expect, it } from "vitest";
import { GET } from "./route";

describe("canvas dashboards demo route", () => {
  it("lists demo dashboards for the portal", async () => {
    const response = await GET();
    const payload = (await response.json()) as {
      dashboards: Array<{ id: string; name: string }>;
      selectedDashboardId: string | null;
    };

    expect(payload.dashboards.length).toBeGreaterThan(0);
    expect(payload.dashboards[0]?.id).toBe("dash_1");
    expect(payload.selectedDashboardId).toBe("dash_1");
  });
});
