export async function GET() {
  return Response.json({
    signedAssertion: "local-dev-assertion"
  });
}
