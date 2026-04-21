import type { PortalSession } from "./session";

type AccessibleAppLike = {
  appName: string;
  appDisplayName?: string;
  appLogoName?: string;
  roles: string[];
};

export function resolveAccessibleAppSession(
  session: PortalSession,
  apps: AccessibleAppLike[]
) {
  const activeApp =
    apps.find((app) => app.appName === session.selectedApp) ?? apps[0] ?? null;

  if (!activeApp) {
    return {
      session,
      activeApp: null
    };
  }

  return {
    session:
      activeApp.appName === session.selectedApp
        ? session
        : {
            ...session,
            selectedApp: activeApp.appName
          },
    activeApp
  };
}
