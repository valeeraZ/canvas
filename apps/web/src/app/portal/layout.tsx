import type { ReactNode } from "react";

export default function PortalLayout(props: { children: ReactNode }) {
  return <>{props.children}</>;
}
