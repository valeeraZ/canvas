import { buildObjectKey } from "../../../../../../packages/storage/src/presign.js";

export async function createUploadSession(input: {
  tenantId: string;
  filename: string;
  uploadId: string;
  bucket: string;
}) {
  return {
    uploadId: input.uploadId,
    bucket: input.bucket,
    objectKey: buildObjectKey({
      tenantId: input.tenantId,
      filename: input.filename
    }),
    uploadUrl: `/datasets/uploads/${input.uploadId}/file`
  };
}
