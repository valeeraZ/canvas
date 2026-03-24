import React from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, LayoutDashboard } from "lucide-react";
import { Badge } from "../ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "../ui/card";

export function DashboardList(props: {
  dashboards: Array<{
    id: string;
    name: string;
  }>;
  selectedDashboardId: string | null;
}) {
  return (
    <section className="grid gap-6">
      <div className="flex items-center gap-3">
        <div className="rounded-full bg-canvas-accent/10 p-2 text-canvas-accent">
          <LayoutDashboard className="h-4 w-4" />
        </div>
        <div>
          <h2 className="text-2xl font-semibold">Dashboard inventory</h2>
          <p className="text-sm text-canvas-muted">
            Review dashboard ownership, current embed choice, and sharing details.
          </p>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {props.dashboards.map((dashboard) => {
          const isSelected = dashboard.id === props.selectedDashboardId;

          return (
            <Card key={dashboard.id}>
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <CardTitle>{dashboard.name}</CardTitle>
                    <CardDescription>{dashboard.id}</CardDescription>
                  </div>
                  {isSelected ? (
                    <Badge variant="accent">Selected for embed</Badge>
                  ) : (
                    <Badge>Available</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-sm text-canvas-muted">
                  <CheckCircle2 className="h-4 w-4" />
                  {isSelected
                    ? "This dashboard is the current embed default."
                    : "Open detail to share or make it the embed default."}
                </div>
                <Link
                  className="inline-flex items-center gap-1 text-sm font-medium text-canvas-accent"
                  href={`/portal/dashboards/${dashboard.id}`}
                >
                  Manage
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
