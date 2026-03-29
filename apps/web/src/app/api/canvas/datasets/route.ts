import { createPortalBackendClient } from "../../../../lib/portal/backend-client";
import { readPortalSessionFromCookieHeader } from "../../../../lib/portal/session";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    filename?: string;
    name?: string;
  };
  const session = readPortalSessionFromCookieHeader(
    request.headers.get("cookie") ?? ""
  );

  if (!session) {
    return Response.json(
      {
        message: "Missing portal session"
      },
      {
        status: 401
      }
    );
  }

  const result = await createPortalBackendClient(session).createDatasetUpload({
    filename: body.filename ?? "dataset.csv",
    name: body.name ?? "Dataset Upload"
  });

  return Response.json(result);
}

export async function GET(request: Request) {
  const session = readPortalSessionFromCookieHeader(
    request.headers.get("cookie") ?? ""
  );

  if (!session) {
    return Response.json(
      {
        message: "Missing portal session"
      },
      {
        status: 401
      }
    );
  }

  const datasets = await createPortalBackendClient(session).listDatasets();
  return Response.json(datasets);
}
