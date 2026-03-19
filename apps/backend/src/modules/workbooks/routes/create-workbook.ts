import { buildWorkbookRecord } from "../../../../../../packages/db/src/workbook-repository";

export async function createWorkbook(input: { tenantId: string; name: string }) {
  return buildWorkbookRecord(input);
}
