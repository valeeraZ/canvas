import { randomUUID } from "node:crypto";

export function createRouteRequestId() {
  return randomUUID();
}

export function jsonWithRequestId(
  body: unknown,
  input: {
    status?: number;
    requestId?: string;
    headers?: HeadersInit;
  } = {}
) {
  const headers = new Headers(input.headers);
  headers.set("x-request-id", input.requestId ?? createRouteRequestId());

  return Response.json(body, {
    status: input.status,
    headers
  });
}
