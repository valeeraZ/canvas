import type { PortalSession } from "./session";

const RESERVED_PORTAL_SEGMENTS = new Set([
  "login",
  "dashboards",
  "datasets",
  "workbooks"
]);

export function scopePortalSession(
  session: PortalSession,
  appName: string | null | undefined
): PortalSession {
  if (!appName || appName === session.selectedApp) {
    return session;
  }

  return {
    ...session,
    selectedApp: appName
  };
}

export function readPortalAppNameFromPathname(pathname: string): string | null {
  const segments = pathname.split("/").filter(Boolean);

  if (segments[0] !== "portal" || segments.length < 2) {
    return null;
  }

  const appName = segments[1] ?? null;

  if (!appName || RESERVED_PORTAL_SEGMENTS.has(appName)) {
    return null;
  }

  return appName;
}

export function readPortalAppNameFromRequest(request: Request): string | null {
  return request.headers.get("x-canvas-app-name");
}
