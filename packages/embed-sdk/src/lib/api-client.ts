export async function exchangeSession(_: {
  exchangeUrl: string;
  signedAssertion: string;
}) {
  return { status: "ready" as const };
}
