import { describe, expect, it } from "vitest";
import { existsSync } from "node:fs";

describe("service skeletons", () => {
  it("creates all planned entrypoints", () => {
    expect(existsSync("apps/backend/src/main.ts")).toBe(true);
    expect(existsSync("apps/backend/src/api/index.ts")).toBe(true);
    expect(existsSync("apps/backend/src/worker/index.ts")).toBe(true);
    expect(existsSync("apps/backend/src/modules/session/index.ts")).toBe(true);
  });
});
