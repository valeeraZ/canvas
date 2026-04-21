export type DashboardRecord = {
  id: string;
  tenantId: string;
  name: string;
  workbookId: string | null;
  status: string;
  author: {
    externalUserId: string | null;
    displayName: string | null;
  };
  createdAt: string;
  updatedAt: string;
};
