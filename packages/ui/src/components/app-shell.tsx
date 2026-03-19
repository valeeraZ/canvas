import React, { type ReactNode } from "react";
import type { TenantTheme } from "../../../contracts/src/theme";
import { ThemeProvider } from "../theme/provider";

export function AppShell(props: { theme: TenantTheme; children: ReactNode }) {
  return <ThemeProvider theme={props.theme}>{props.children}</ThemeProvider>;
}
