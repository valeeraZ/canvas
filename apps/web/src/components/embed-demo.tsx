import React from "react";
import { IngestionDemoPanel } from "./ingestion-demo-panel";
import { MockSessionPanel } from "./mock-session-panel";

export function EmbedDemo() {
  return (
    <main>
      <h1>Canvas Embed Demo</h1>
      <p>Local host integration sample</p>
      <MockSessionPanel />
      <IngestionDemoPanel />
    </main>
  );
}
