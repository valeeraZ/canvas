import { describe, expect, it } from "vitest";
import { existsSync } from "node:fs";

describe("workspace bootstrap", () => {
  it("declares the root monorepo files", () => {
    expect(existsSync("pnpm-workspace.yaml")).toBe(true);
    expect(existsSync("turbo.json")).toBe(true);
    expect(existsSync("tsconfig.base.json")).toBe(true);
  });
});
