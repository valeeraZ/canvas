import { DashboardExportButton } from "./dashboard-export-button";
import { DashboardImportDialog } from "./dashboard-import-dialog";
import { DashboardSharePanel } from "./dashboard-share-panel";

export function DashboardEditor() {
  return (
    <section>
      <h2>Dashboard Editor</h2>
      <DashboardSharePanel />
      <DashboardExportButton />
      <DashboardImportDialog />
    </section>
  );
}
