import { describe, expect, it } from "vitest";
import { normalizeRows } from "./normalize-rows";

describe("normalizeRows", () => {
  it("converts CSV cells into typed JSON-ready values and normalizes headers", () => {
    const result = normalizeRows({
      headers: [" Order Date ", "Amount", "Active", "Notes"],
      rows: [
        ["2026-03-01", "42", "true", " ready "],
        ["", "18.5", "false", "   "]
      ]
    });

    expect(result.headers[0]).toBe("order_date");
    expect(result.rows[0]).toEqual([
      "2026-03-01",
      42,
      true,
      "ready"
    ]);
    expect(result.rows[1][0]).toBeNull();
    expect(result.rows[1][1]).toBe(18.5);
    expect(result.rows[1][2]).toBe(false);
    expect(result.rows[1][3]).toBeNull();
  });
});
