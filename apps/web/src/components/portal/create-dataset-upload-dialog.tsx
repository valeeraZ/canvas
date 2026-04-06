"use client";

import React, { startTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle, Upload } from "lucide-react";
import {
  createPortalApiClient,
  type PortalApiError,
  toPortalApiError
} from "../../lib/portal/api-client";
import { PortalActionAlert } from "./portal-action-alert";
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

export function CreateDatasetUploadDialog() {
  const router = useRouter();
  const apiClient = createPortalApiClient();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("Sales Upload");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<PortalApiError | null>(null);
  const [pending, setPending] = useState(false);

  function submit() {
    if (!file) {
      return;
    }

    setPending(true);
    setError(null);

    startTransition(async () => {
      try {
        const session = await apiClient.createDatasetUpload({
          filename: file.name,
          name: name.trim() || "Dataset Upload",
          contentType: file.type || undefined,
          sizeBytes: file.size
        });
        await apiClient.uploadDatasetFile({
          uploadId: session.uploadId,
          file
        });
        setOpen(false);
        router.refresh();
      } catch (caught) {
        setError(toPortalApiError(caught));
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
            disabled={pending || !file}
          >
            {pending ? <LoaderCircle className="size-4 animate-spin" /> : null}
            Upload file
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
