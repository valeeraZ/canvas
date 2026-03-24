export type PortalSession = {
  token: string;
  selectedApp: string;
  principal: {
    displayName: string;
    employeeId: string;
    roles: string[];
  };
};

export const PORTAL_SESSION_COOKIE = "canvas_portal_session";

type CookieStoreLike = {
  get: (name: string) => { value: string } | undefined;
};

export function encodePortalSession(session: PortalSession) {
  return Buffer.from(JSON.stringify(session), "utf8").toString("base64url");
}

export function decodePortalSession(value: string | undefined) {
  if (!value) {
    return null;
  }

  try {
    const parsed = JSON.parse(
      Buffer.from(value, "base64url").toString("utf8")
    ) as PortalSession;

    if (!parsed.token || !parsed.selectedApp || !parsed.principal?.employeeId) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

export function readPortalSession(cookieStore: CookieStoreLike) {
  return decodePortalSession(cookieStore.get(PORTAL_SESSION_COOKIE)?.value);
}
