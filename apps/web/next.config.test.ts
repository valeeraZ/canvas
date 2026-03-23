import { describe, expect, it } from "vitest";
import nextConfig from "./next.config.mjs";

describe("next.config", () => {
  it("allows VS Code local dev origin", () => {
    expect(nextConfig.allowedDevOrigins).toContain("127.0.0.1");
  });
});
