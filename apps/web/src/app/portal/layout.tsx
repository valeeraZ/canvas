import type { ReactNode } from "react";
import { DatasetUploadProgressProvider } from "../../components/portal/dataset-upload-progress-provider";

export default function PortalLayout(props: { children: ReactNode }) {
  return (
    <DatasetUploadProgressProvider>
      {props.children}
    </DatasetUploadProgressProvider>
  );
}
