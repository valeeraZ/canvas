export function createStubService(name: string) {
  return { name, status: "bootstrapped" as const };
}
