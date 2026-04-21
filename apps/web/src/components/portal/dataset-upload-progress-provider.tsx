"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";
import { CheckCircle2, LoaderCircle, UploadCloud, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { createPortalApiClient, toPortalApiError } from "../../lib/portal/api-client";

export type DatasetUploadTaskStatus =
  | "uploading"
  | "profiling"
  | "ready"
  | "failed";

export type DatasetUploadTask = {
  id: string;
  appName?: string;
  datasetId?: string;
  datasetName: string;
  status: DatasetUploadTaskStatus;
  progress: number;
  message?: string;
};

type StartDatasetUploadInput = {
  appName?: string;
  name: string;
  file: File;
};

type DatasetUploadProgressContextValue = {
  startDatasetUpload(input: StartDatasetUploadInput): Promise<void>;
};

const DatasetUploadProgressContext =
  createContext<DatasetUploadProgressContextValue | null>(null);

const pendingBackendStatuses = new Set([
  "queued",
  "profiling",
  "processing"
]);

function createTaskId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `upload_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

export function DatasetUploadProgressList(props: {
  tasks: DatasetUploadTask[];
}) {
  if (props.tasks.length === 0) {
    return null;
  }

  return (
    <div className="fixed right-4 top-4 z-50 grid w-[min(24rem,calc(100vw-2rem))] gap-3">
      {props.tasks.map((task) => {
        const isUploading = task.status === "uploading";
        const isProfiling = task.status === "profiling";
        const isReady = task.status === "ready";
        const isFailed = task.status === "failed";

        return (
          <div
            key={task.id}
            className="rounded-xl border border-border bg-popover/95 p-4 text-popover-foreground shadow-lg backdrop-blur"
          >
            <div className="flex items-start gap-3">
              <div className="mt-0.5 text-muted-foreground">
                {isReady ? <CheckCircle2 className="size-4 text-emerald-600" /> : null}
                {isFailed ? <XCircle className="size-4 text-destructive" /> : null}
                {isUploading ? <UploadCloud className="size-4" /> : null}
                {isProfiling ? <LoaderCircle className="size-4 animate-spin" /> : null}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium">{task.datasetName}</div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {isUploading ? `${task.progress}% uploaded` : null}
                  {isProfiling ? "Analyzing dataset schema" : null}
                  {isReady ? "Dataset is ready" : null}
                  {isFailed ? task.message ?? "Dataset upload failed" : null}
                </div>
                {isUploading ? (
                  <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{ width: `${Math.min(100, Math.max(0, task.progress))}%` }}
                    />
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function DatasetUploadProgressProvider(props: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const apiClient = useMemo(() => createPortalApiClient(), []);
  const [tasks, setTasks] = useState<DatasetUploadTask[]>([]);
  const pollingTimers = useRef<Record<string, number>>({});

  useEffect(() => {
    return () => {
      for (const timer of Object.values(pollingTimers.current)) {
        window.clearTimeout(timer);
      }
    };
  }, []);

  function patchTask(id: string, patch: Partial<DatasetUploadTask>) {
    setTasks((current) =>
      current.map((task) => (task.id === id ? { ...task, ...patch } : task))
    );
  }

  function scheduleRemoval(id: string) {
    window.setTimeout(() => {
      setTasks((current) => current.filter((task) => task.id !== id));
    }, 8000);
  }

  async function pollDatasetStatus(input: {
    taskId: string;
    datasetId: string;
    appName?: string;
  }) {
    try {
      const dataset = await apiClient.getDataset(input.datasetId, {
        appName: input.appName
      });
      const status = dataset.importStatus ?? dataset.status;

      if (status === "ready") {
        patchTask(input.taskId, {
          status: "ready",
          progress: 100,
          message: "Dataset is ready"
        });
        router.refresh();
        scheduleRemoval(input.taskId);
        return;
      }

      if (status === "failed") {
        patchTask(input.taskId, {
          status: "failed",
          progress: 100,
          message: dataset.warnings[0]?.message ?? "Dataset profiling failed"
        });
        router.refresh();
        scheduleRemoval(input.taskId);
        return;
      }

      if (pendingBackendStatuses.has(status)) {
        patchTask(input.taskId, {
          status: "profiling",
          progress: 100
        });
      }
    } catch (error) {
      const parsed = toPortalApiError(error);
      patchTask(input.taskId, {
        status: "failed",
        message: parsed.message
      });
      scheduleRemoval(input.taskId);
      return;
    }

    pollingTimers.current[input.taskId] = window.setTimeout(() => {
      void pollDatasetStatus(input);
    }, 2500);
  }

  async function startDatasetUpload(input: StartDatasetUploadInput) {
    const taskId = createTaskId();
    const datasetName = input.name.trim() || input.file.name.replace(/\.[^.]+$/, "");

    setTasks((current) => [
      ...current,
      {
        id: taskId,
        appName: input.appName,
        datasetName,
        status: "uploading",
        progress: 0
      }
    ]);

    try {
      const session = await apiClient.createDatasetUpload({
        appName: input.appName,
        filename: input.file.name,
        name: datasetName,
        contentType: input.file.type || undefined,
        sizeBytes: input.file.size
      });
      patchTask(taskId, {
        datasetId: session.dataset.id
      });

      const uploaded = await apiClient.uploadDatasetFile({
        appName: input.appName,
        uploadId: session.uploadId,
        file: input.file,
        onProgress: (progress) => {
          patchTask(taskId, {
            status: "uploading",
            progress
          });
        }
      });

      patchTask(taskId, {
        datasetId: uploaded.datasetId,
        status: "profiling",
        progress: 100
      });
      void pollDatasetStatus({
        taskId,
        datasetId: uploaded.datasetId,
        appName: input.appName
      });
      router.refresh();
    } catch (error) {
      const parsed = toPortalApiError(error);
      patchTask(taskId, {
        status: "failed",
        message: parsed.message
      });
      scheduleRemoval(taskId);
    }
  }

  return (
    <DatasetUploadProgressContext.Provider value={{ startDatasetUpload }}>
      {props.children}
      <DatasetUploadProgressList tasks={tasks} />
    </DatasetUploadProgressContext.Provider>
  );
}

export function useDatasetUploadProgress() {
  const context = useContext(DatasetUploadProgressContext);

  if (!context) {
    return {
      async startDatasetUpload() {
        throw new Error(
          "useDatasetUploadProgress must be used inside DatasetUploadProgressProvider"
        );
      }
    };
  }

  return context;
}
