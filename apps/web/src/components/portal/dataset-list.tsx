import React from "react";
import { Database } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "../ui/card";
import { Badge } from "../ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "../ui/table";

export function DatasetList(props: {
  datasets: Array<{
    id: string;
    name: string;
    status: string;
    warningCount: number;
  }>;
}) {
  return (
    <Card>
      <CardHeader className="border-b">
        <div className="flex items-center gap-3">
          <div className="rounded-lg border border-border bg-muted/60 p-2 text-muted-foreground">
            <Database className="h-4 w-4" />
          </div>
          <div>
            <CardTitle>Dataset inventory</CardTitle>
            <CardDescription>
              Review ingestion state and warning counts for datasets in the active app.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Dataset</TableHead>
              <TableHead>ID</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Warnings</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {props.datasets.map((dataset) => (
              <TableRow key={dataset.id}>
                <TableCell className="font-medium">{dataset.name}</TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">
                  {dataset.id}
                </TableCell>
                <TableCell>
                  <Badge variant={dataset.status === "ready" ? "secondary" : "outline"}>
                    {dataset.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right text-sm text-muted-foreground">
                  {dataset.warningCount}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
