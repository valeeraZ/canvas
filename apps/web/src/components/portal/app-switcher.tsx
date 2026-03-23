import React from "react";

export function AppSwitcher(props: {
  apps: string[];
  currentApp: string;
}) {
  return (
    <section>
      <h2>Current App</h2>
      <p>{props.currentApp}</p>
      <ul>
        {props.apps.map((app) => (
          <li key={app}>{app}</li>
        ))}
      </ul>
    </section>
  );
}
