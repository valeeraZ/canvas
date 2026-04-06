"use client";

import React, { useState } from "react";

type DatasetSummary = {
  id: string;
  name: string;
  status: string;
  warningCount: number;
};

export function IngestionDemoPanel() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [datasets, setDatasets] = useState<DatasetSummary[]>([]);

  async function runDemo() {
    setLoading(true);
    setError(null);

    try {
      const filename = `sales-${Date.now()}.csv`;

      const createResponse = await fetch("/api/canvas/datasets", {
        method: "POST",
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify({
          filename,
          name: "Sales Upload",
          content: "Month,Revenue,Active\nJan,120,true\nFeb,150,false"
        })
      });

      if (!createResponse.ok) {
        throw new Error(`Create dataset failed: ${createResponse.status}`);
      }

      const listResponse = await fetch("/api/canvas/datasets");
      if (!listResponse.ok) {
        throw new Error(`List dataset failed: ${listResponse.status}`);
      }

      const listed = (await listResponse.json()) as DatasetSummary[];
      setDatasets(listed);
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "Unknown error";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section>
      <h2>Dataset Ingestion Demo</h2>
      <button type="button" onClick={runDemo} disabled={loading}>
        {loading ? "Running..." : "Run Ingestion Demo"}
      </button>
      {error ? <p>Ingestion failed: {error}</p> : null}
      {datasets.length > 0 ? (
        <ul>
          {datasets.map((dataset) => (
            <li key={dataset.id}>
              {dataset.name} - {dataset.status} (warnings: {dataset.warningCount})
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
