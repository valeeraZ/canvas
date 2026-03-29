import React from "react";
import { BookOpen } from "lucide-react";
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
}) {
  return (
    <Card>
      <CardHeader className="border-b">
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
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Workbook</TableHead>
              <TableHead>ID</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {props.workbooks.map((workbook) => (
              <TableRow key={workbook.id}>
                <TableCell className="font-medium">{workbook.name}</TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">
                  {workbook.id}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
