import { describe, expect, it } from "vitest";
import { existsSync } from "node:fs";

describe("k8s base layout", () => {
  it("contains a kustomization and core deployment manifests", () => {
    expect(existsSync("infra/k8s/base/kustomization.yaml")).toBe(true);
    expect(existsSync("infra/k8s/base/backend-api-deployment.yaml")).toBe(true);
    expect(existsSync("infra/k8s/base/backend-worker-deployment.yaml")).toBe(true);
  });
});
