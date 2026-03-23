import React from "react";
import { AppSwitcher } from "./app-switcher";

export function PortalShell(props: {
  apps: string[];
  currentApp: string;
}) {
  return (
    <main>
      <h1>Canvas Portal</h1>
      <AppSwitcher apps={props.apps} currentApp={props.currentApp} />
    </main>
  );
}
