import React from "react";

export function DashboardSharePanel(props: {
  dashboardId: string;
  shareSubjects: Array<{
    type: "user" | "group" | "role";
    id: string;
  }>;
}) {
  return (
    <div>
      <h3>Sharing</h3>
      <form
        action={`/api/canvas/dashboards/${props.dashboardId}/share`}
        method="post"
      >
        <p>Existing subjects</p>
        <ul>
          {props.shareSubjects.map((subject) => (
            <li key={`${subject.type}:${subject.id}`}>
              {subject.type}: {subject.id}
            </li>
          ))}
        </ul>
      </form>
    </div>
  );
}
