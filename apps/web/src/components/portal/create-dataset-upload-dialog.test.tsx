import React from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToString } from "react-dom/server";
import { CreateDatasetUploadDialog } from "./create-dataset-upload-dialog";
import { DatasetUploadProgressProvider } from "./dataset-upload-progress-provider";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: vi.fn()
  })
}));

describe("CreateDatasetUploadDialog", () => {
  it("renders upload dataset affordances", () => {
    const html = renderToString(
      <DatasetUploadProgressProvider>
        <CreateDatasetUploadDialog
          appOptions={[
            { appName: "canvas", appDisplayName: "Canvas" },
            { appName: "frame_app", appDisplayName: "Frame App" }
          ]}
        />
      </DatasetUploadProgressProvider>
    );

    expect(html).toContain("Upload dataset");
    expect(html).not.toContain("Target app");
  });
});
