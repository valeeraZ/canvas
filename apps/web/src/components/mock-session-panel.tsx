"use client";

import React, { useState } from "react";

type SessionModel = {
  expiresIn: number;
  selectedApp: string;
  principal: {
    displayName: string;
    employeeId: string;
    roles: string[];
  };
};

export function MockSessionPanel() {
  const [session, setSession] = useState<SessionModel | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function simulateLogin() {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/canvas/session", {
        method: "POST",
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify({ appName: "canvas" })
      });

      if (!response.ok) {
        throw new Error(`Session request failed: ${response.status}`);
      }

      const payload = (await response.json()) as SessionModel;
      setSession(payload);
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "Unknown error";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section>
      <button type="button" onClick={simulateLogin} disabled={loading}>
        {loading ? "Loading..." : "Simulate Login"}
      </button>
      {error ? <p>Login failed: {error}</p> : null}
      {session ? (
        <div>
          <p>
            Signed in as {session.principal.displayName} ({session.principal.employeeId})
          </p>
          <p>Selected App: {session.selectedApp}</p>
          <p>Roles: {session.principal.roles.join(", ")}</p>
          <p>Expires In: {session.expiresIn}s</p>
        </div>
      ) : null}
    </section>
  );
}
