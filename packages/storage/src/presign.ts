export function buildObjectKey(input: { tenantId: string; filename: string }): string {
  return `${input.tenantId}/uploads/${input.filename}`;
}

export function createPresignedUpload(input: {
  endpoint: string;
  bucket: string;
  objectKey: string;
}) {
  const base = input.endpoint.replace(/\/+$/, "");
  return {
    bucket: input.bucket,
    objectKey: input.objectKey,
    uploadUrl: `${base}/${input.bucket}/${input.objectKey}`
  };
}
