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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "../ui/table";

export function DashboardList(props: {
  appName: string;
  dashboards: Array<{
    id: string;
    name: string;
  }>;
  selectedDashboardId: string | null;
  actions?: React.ReactNode;
}) {
  return (
    <section className="grid gap-6">
      <Card>
        <CardHeader className="border-b">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="rounded-lg border border-border bg-muted/60 p-2 text-muted-foreground">
                <LayoutDashboard className="h-4 w-4" />
              </div>
              <div>
                <CardTitle>Dashboard inventory</CardTitle>
                <CardDescription>
                  Review dashboard ownership, current embed choice, and sharing details.
                </CardDescription>
              </div>
            </div>
            {props.actions}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Dashboard</TableHead>
                <TableHead>ID</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Embed</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {props.dashboards.map((dashboard) => {
                const isSelected = dashboard.id === props.selectedDashboardId;

                return (
                  <TableRow key={dashboard.id}>
                    <TableCell className="font-medium">{dashboard.name}</TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {dashboard.id}
                    </TableCell>
                    <TableCell>
                      <Badge variant={isSelected ? "secondary" : "outline"}>
                        {isSelected ? "Selected for embed" : "Available"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      <span className="inline-flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4" />
                        {isSelected
                          ? "Current default for SDK viewers"
                          : "Ready to be selected"}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Link
                        className="inline-flex items-center gap-1 text-sm font-medium text-primary"
                        href={`/portal/${props.appName}/${dashboard.id}`}
                      >
                        Manage
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </section>
  );
}
