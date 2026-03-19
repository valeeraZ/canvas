import React, { type ReactNode } from "react";
import type { TenantTheme } from "../../../contracts/src/theme";

export function ThemeProvider(props: { theme: TenantTheme; children: ReactNode }) {
  return (
    <div data-brand={props.theme.brandName} data-accent={props.theme.accent}>
      <span>{props.theme.brandName}</span>
      {props.children}
    </div>
  );
}
