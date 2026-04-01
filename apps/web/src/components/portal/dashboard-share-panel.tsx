"use client";

import React, { startTransition, useState } from "react";
import { X } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  createPortalApiClient,
  type PortalApiError,
  toPortalApiError
} from "../../lib/portal/api-client";
import { PortalActionAlert } from "./portal-action-alert";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "../ui/select";

export function DashboardSharePanel(props: {
  dashboardId: string;
  shareSubjects: Array<{
    type: "user" | "group" | "role";
    id: string;
  }>;
}) {
  const router = useRouter();
  const apiClient = createPortalApiClient();
  const [subjects, setSubjects] = useState(props.shareSubjects);
  const [subjectType, setSubjectType] = useState<"user" | "group" | "role">("role");
  const [subjectId, setSubjectId] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<PortalApiError | null>(null);

  function addSubject() {
    if (!subjectId.trim()) {
      return;
    }

    setSubjects((current) => [
      ...current,
      {
        type: subjectType,
        id: subjectId.trim()
      }
    ]);
    setSubjectId("");
  }

  function removeSubject(index: number) {
    setSubjects((current) => current.filter((_, itemIndex) => itemIndex !== index));
  }

  function saveSharing() {
    setPending(true);
    setError(null);

    startTransition(async () => {
      try {
        await apiClient.shareDashboard({
          dashboardId: props.dashboardId,
          subjects
        });
        router.refresh();
      } catch (caught) {
        setError(toPortalApiError(caught));
      } finally {
        setPending(false);
      }
    });
  }

  return (
    <div className="grid gap-4 p-6">
      <PortalActionAlert error={error} title="Sharing update failed" />
      <div className="grid gap-1">
        <h3 className="text-sm font-medium">Visibility subjects</h3>
        <p className="text-sm text-muted-foreground">
          Share this dashboard with external users, groups, or roles.
        </p>
      </div>
      <div className="grid gap-2">
        <div className="flex flex-wrap gap-2">
          {subjects.length ? (
            subjects.map((subject, index) => (
              <Badge
                key={`${subject.type}:${subject.id}:${index}`}
                className="gap-2 pr-1"
                variant="secondary"
              >
                {subject.type}:{subject.id}
                <button type="button" onClick={() => removeSubject(index)}>
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">No visibility subjects yet.</p>
          )}
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-[140px_1fr_auto]">
        <div className="grid gap-2">
          <Label htmlFor={`subject-type-${props.dashboardId}`}>Subject type</Label>
          <Select
            value={subjectType}
            onValueChange={(value) =>
              setSubjectType(value as "user" | "group" | "role")
            }
          >
            <SelectTrigger id={`subject-type-${props.dashboardId}`}>
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="user">user</SelectItem>
              <SelectItem value="group">group</SelectItem>
              <SelectItem value="role">role</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-2">
          <Label htmlFor={`subject-id-${props.dashboardId}`}>Subject id</Label>
          <Input
            id={`subject-id-${props.dashboardId}`}
            value={subjectId}
            onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
              const target = event.target as HTMLInputElement;
              setSubjectId(target.value);
            }}
            placeholder="finance or ADMIN or dev-1"
          />
        </div>
        <div className="flex items-end">
          <Button type="button" variant="outline" onClick={addSubject}>
            Add subject
          </Button>
        </div>
      </div>
      <div className="flex justify-end">
        <Button type="button" onClick={saveSharing} disabled={pending}>
          Save sharing
        </Button>
      </div>
    </div>
  );
}
