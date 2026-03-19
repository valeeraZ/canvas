import React, { type ReactNode } from "react";

export function CanvasProvider(props: {
  bootstrap: { sessionEndpoint: string };
  children: ReactNode;
}) {
  return (
    <div data-session-endpoint={props.bootstrap.sessionEndpoint}>{props.children}</div>
  );
}
