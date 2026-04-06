import React from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToString } from "react-dom/server";
import { CreateDatasetUploadDialog } from "./create-dataset-upload-dialog";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: vi.fn()
  })
}));

describe("CreateDatasetUploadDialog", () => {
  it("renders upload dataset affordances", () => {
    const html = renderToString(<CreateDatasetUploadDialog />);

    expect(html).toContain("Upload dataset");
  });
});
