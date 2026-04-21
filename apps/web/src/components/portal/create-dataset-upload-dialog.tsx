"use client";

import React, { startTransition, useState } from "react";
import { LoaderCircle, Upload } from "lucide-react";
import type { PortalApiError } from "../../lib/portal/api-client";
import { PortalActionAlert } from "./portal-action-alert";
import { useDatasetUploadProgress } from "./dataset-upload-progress-provider";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "../ui/dialog";
import { Input } from "../ui/input";
import { Label } from "../ui/label";

export function CreateDatasetUploadDialog(props: {
  appOptions?: Array<{
    appName: string;
    appDisplayName: string;
  }>;
}) {
  const { startDatasetUpload } = useDatasetUploadProgress();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("Sales Upload");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<PortalApiError | null>(null);
  const [pending, setPending] = useState(false);
  const [selectedApp, setSelectedApp] = useState(
    props.appOptions?.[0]?.appName ?? ""
  );

  function submit() {
    if (!file) {
      return;
    }

    setPending(true);
    setError(null);

    startTransition(async () => {
      try {
        await startDatasetUpload({
          appName: selectedApp || undefined,
          name: name.trim() || "Dataset Upload",
          file
        });
        setOpen(false);
      } catch (caught) {
        setError(caught instanceof Error ? (caught as PortalApiError) : null);
      } finally {
        setPending(false);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Upload className="size-4" />
          Upload dataset
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Upload dataset</DialogTitle>
          <DialogDescription>
            Select a CSV or XLSX file and Canvas will stream it to object storage for processing.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="create-dataset-name">Dataset name</Label>
            <Input
              id="create-dataset-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Sales Upload"
            />
          </div>
          {props.appOptions && props.appOptions.length > 0 ? (
            <div className="grid gap-2">
              <Label htmlFor="create-dataset-app">Target app</Label>
              <select
                id="create-dataset-app"
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                value={selectedApp}
                onChange={(event) => setSelectedApp(event.target.value)}
              >
                {props.appOptions.map((app) => (
                  <option key={app.appName} value={app.appName}>
                    {app.appDisplayName}
                  </option>
                ))}
              </select>
            </div>
          ) : null}
          <div className="grid gap-2">
            <Label htmlFor="create-dataset-file">Select file</Label>
            <Input
              id="create-dataset-file"
              type="file"
              accept=".csv,.xlsx"
              onChange={(event) => {
                const nextFile = event.target.files?.[0] ?? null;
                setFile(nextFile);
                if (nextFile && name === "Sales Upload") {
                  setName(nextFile.name.replace(/\.[^.]+$/, ""));
                }
              }}
            />
          </div>
          {file ? (
            <div className="rounded-lg border border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
              <div className="font-medium text-foreground">{file.name}</div>
              <div>{file.type || "application/octet-stream"}</div>
              <div>{Math.max(1, Math.round(file.size / 1024))} KB</div>
            </div>
          ) : null}
        </div>
        <PortalActionAlert error={error} title="Dataset upload failed" />
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            type="button"
            onClick={submit}
            disabled={pending || !file || (props.appOptions?.length ? !selectedApp : false)}
          >
            {pending ? <LoaderCircle className="size-4 animate-spin" /> : null}
            Upload file
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
