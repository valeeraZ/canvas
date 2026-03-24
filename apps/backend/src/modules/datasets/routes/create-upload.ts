import { buildObjectKey } from "../../../../../../packages/storage/src/presign.js";

export async function createUploadSession(input: {
  tenantId: string;
  filename: string;
}) {
  return {
    bucket: "canvas-raw",
    objectKey: buildObjectKey({
      tenantId: input.tenantId,
      filename: input.filename
    })
  };
}
