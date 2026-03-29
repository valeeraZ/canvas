export type DashboardExportPackage = {
  version: 1;
  dashboard: {
    name: string;
    workbookId: string | null;
  };
  shareSubjects: Array<{
    type: "user" | "group" | "role";
    id: string;
  }>;
};
