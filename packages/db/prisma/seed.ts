import { buildSeedTenant } from "../src/seed";

export function buildPrismaSeed() {
  const tenant = buildSeedTenant();

  return {
    tenants: [tenant]
  };
}
