import { describe, expect, it } from "vitest";
import { bootstrapSession } from "./use-canvas-session";

describe("bootstrapSession", () => {
  it("returns a client session model", async () => {
    const result = await bootstrapSession({
      signedAssertion: "assertion",
      exchangeUrl: "http://localhost:3001/session/exchange"
    });

    expect(result.status).toBe("ready");
  });
});
