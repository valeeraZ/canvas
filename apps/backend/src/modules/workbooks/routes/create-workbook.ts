import { buildWorkbookRecord } from "../../../../../../packages/db/src/workbook-repository.js";

export async function createWorkbook(input: { tenantId: string; name: string }) {
  return buildWorkbookRecord(input);
}
