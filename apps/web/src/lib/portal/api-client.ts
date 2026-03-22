export type PortalApiClient = {
  listApps: () => Promise<string[]>;
};

export function createPortalApiClient(): PortalApiClient {
  return {
    async listApps() {
      return [];
    }
  };
}
