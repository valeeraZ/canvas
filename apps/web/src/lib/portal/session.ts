export type PortalSession = {
  token: string;
  selectedApp: string;
  recentApps?: string[];
  recentDashboardsByApp?: Record<string, string>;
  recentWorkbooksByApp?: Record<string, string>;
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

    return {
      ...parsed,
      recentApps: Array.isArray(parsed.recentApps)
        ? parsed.recentApps
        : [parsed.selectedApp],
      recentDashboardsByApp:
        parsed.recentDashboardsByApp &&
        typeof parsed.recentDashboardsByApp === "object"
          ? parsed.recentDashboardsByApp
          : {},
      recentWorkbooksByApp:
        parsed.recentWorkbooksByApp &&
        typeof parsed.recentWorkbooksByApp === "object"
          ? parsed.recentWorkbooksByApp
          : {}
    } satisfies PortalSession;
  } catch {
    return null;
  }
}

export function prependRecentValue(values: string[], nextValue: string) {
  return [nextValue, ...values.filter((value) => value !== nextValue)];
}

export function readPortalSession(cookieStore: CookieStoreLike) {
  return decodePortalSession(cookieStore.get(PORTAL_SESSION_COOKIE)?.value);
}

export function readPortalSessionFromCookieHeader(cookieHeader: string) {
  const cookieMap = new Map(
    cookieHeader
      .split(";")
      .map((entry) => entry.trim())
      .filter(Boolean)
      .map((entry) => {
        const [name, ...rest] = entry.split("=");
        return [name, rest.join("=")];
      })
  );

  return readPortalSession({
    get(name) {
      const value = cookieMap.get(name);
      return value ? { value } : undefined;
    }
  });
}
