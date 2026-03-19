import { describe, expect, it } from "vitest";
import { normalizeRows } from "./normalize-rows";

describe("normalizeRows", () => {
  it("converts blank strings to null and trims headers", () => {
    const result = normalizeRows({
      headers: [" Order Date ", "Amount"],
      rows: [["2026-03-01", "42"], ["", "18"]]
    });

    expect(result.headers[0]).toBe("order_date");
    expect(result.rows[1][0]).toBeNull();
  });
});
