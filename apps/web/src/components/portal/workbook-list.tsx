import React from "react";
import Link from "next/link";
import { ArrowRight, BookOpen } from "lucide-react";
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

export function WorkbookList(props: {
  workbooks: Array<{
    id: string;
    name: string;
  }>;
  actions?: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader className="border-b">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="rounded-lg border border-border bg-muted/60 p-2 text-muted-foreground">
              <BookOpen className="h-4 w-4" />
            </div>
            <div>
              <CardTitle>Workbook inventory</CardTitle>
              <CardDescription>
                Workbooks provide the structural layer that dashboards build on in the active app.
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
              <TableHead>Workbook</TableHead>
              <TableHead>ID</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {props.workbooks.map((workbook) => (
              <TableRow key={workbook.id}>
                <TableCell className="font-medium">{workbook.name}</TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">
                  {workbook.id}
                </TableCell>
                <TableCell className="text-right">
                  <Link
                    className="inline-flex items-center gap-1 text-sm font-medium text-primary"
                    href={`/portal/workbooks/${workbook.id}`}
                  >
                    Manage
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
