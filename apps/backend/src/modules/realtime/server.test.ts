import { describe, expect, it } from "vitest";
import { createChannelName } from "./server";

describe("createChannelName", () => {
  it("namespaces events by tenant", () => {
    expect(createChannelName("tenant_123", "imports")).toBe(
      "tenant_123:imports"
    );
  });
});
