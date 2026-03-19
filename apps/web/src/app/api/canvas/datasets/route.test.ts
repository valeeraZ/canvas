import { describe, expect, it } from "vitest";
import { GET, POST } from "./route";

describe("canvas datasets demo route", () => {
  it("creates a demo ingestion record and lists it", async () => {
    const postRequest = new Request("http://localhost:3000/api/canvas/datasets", {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({
        filename: "sales.csv",
        name: "Sales Upload"
      })
    });

    const postResponse = await POST(postRequest);
    const created = (await postResponse.json()) as {
      upload: { bucket: string; objectKey: string };
      dataset: { name: string; status: string };
    };

    expect(created.upload.bucket).toBe("canvas-raw");
    expect(created.upload.objectKey).toContain("uploads/sales.csv");
    expect(created.dataset.name).toBe("Sales Upload");
    expect(created.dataset.status).toBe("ready");

    const listResponse = await GET();
    const listed = (await listResponse.json()) as Array<{
      name: string;
      status: string;
      warningCount: number;
    }>;

    expect(listed.length).toBeGreaterThan(0);
    expect(listed[0].name).toBe("Sales Upload");
    expect(listed[0].warningCount).toBe(0);
  });
});
