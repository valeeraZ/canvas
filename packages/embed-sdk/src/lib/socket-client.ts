export function createSocketClient(_: { url: string }) {
  return {
    connect() {
      return { connected: true as const };
    }
  };
}
