import { describe, expect, it } from "vitest";
import tsconfig from "./tsconfig.json";

describe("web tsconfig", () => {
  it("maps @/ imports to src", () => {
    expect(tsconfig.compilerOptions?.baseUrl).toBe(".");
    expect(tsconfig.compilerOptions?.paths?.["@/*"]).toEqual(["./src/*"]);
  });
});
