import { describe, expect, it } from "vitest";
import { loadEnv } from "./env";

describe("loadEnv", () => {
  it("returns the required local service URLs", () => {
    const env = loadEnv({
      DATABASE_URL: "postgres://canvas:canvas@localhost:5432/canvas",
      REDIS_URL: "redis://localhost:6379",
      S3_ENDPOINT: "http://localhost:9000"
    });

    expect(env.DATABASE_URL).toContain("postgres://");
    expect(env.REDIS_URL).toContain("redis://");
    expect(env.S3_ENDPOINT).toContain("http://");
  });
});
