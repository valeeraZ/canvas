import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

describe("local postgres compose", () => {
  it("defines a postgres service for local development", () => {
    const compose = readFileSync("infra/local/docker-compose.yml", "utf8");

    expect(compose).toContain("postgres:");
    expect(compose).toContain("POSTGRES_DB: canvas");
    expect(compose).toContain("5432:5432");
  });
});
