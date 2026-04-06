type MultipartUploadPart = {
  etag: string;
  partNumber: number;
};

type MultipartUploadService = {
  create: (input: {
    bucket: string;
    key: string;
    contentType?: string;
  }) => Promise<{
    bucket: string;
    key: string;
    uploadId: string;
  }>;
  uploadPart: (input: {
    bucket: string;
    key: string;
    uploadId: string;
    partNumber: number;
    body: Buffer;
  }) => Promise<MultipartUploadPart>;
  complete: (input: {
    bucket: string;
    key: string;
    uploadId: string;
    parts: MultipartUploadPart[];
  }) => Promise<{
    bucket: string;
    key: string;
  }>;
  abort: (input: {
    bucket: string;
    key: string;
    uploadId: string;
  }) => Promise<void>;
};

export async function streamMultipartUpload(input: {
  multipartUploads: MultipartUploadService;
  bucket: string;
  objectKey: string;
  contentType?: string;
  partSizeBytes: number;
  body: AsyncIterable<string | Buffer>;
}) {
  const upload = await input.multipartUploads.create({
    bucket: input.bucket,
    key: input.objectKey,
    contentType: input.contentType
  });
  const parts: MultipartUploadPart[] = [];
  let nextPartNumber = 1;
  let buffered = Buffer.alloc(0);
  let sizeBytes = 0;

  async function flushPart() {
    if (buffered.length === 0) {
      return;
    }

    const part = await input.multipartUploads.uploadPart({
      bucket: upload.bucket,
      key: upload.key,
      uploadId: upload.uploadId,
      partNumber: nextPartNumber,
      body: buffered
    });

    parts.push(part);
    nextPartNumber += 1;
    buffered = Buffer.alloc(0);
  }

  try {
    for await (const chunk of input.body) {
      const chunkBuffer = Buffer.isBuffer(chunk)
        ? chunk
        : Buffer.from(chunk);
      sizeBytes += chunkBuffer.length;
      buffered = Buffer.concat([buffered, chunkBuffer]);

      while (buffered.length >= input.partSizeBytes) {
        const nextBody = buffered.subarray(0, input.partSizeBytes);
        buffered = buffered.subarray(input.partSizeBytes);
        const part = await input.multipartUploads.uploadPart({
          bucket: upload.bucket,
          key: upload.key,
          uploadId: upload.uploadId,
          partNumber: nextPartNumber,
          body: nextBody
        });
        parts.push(part);
        nextPartNumber += 1;
      }
    }

    await flushPart();
    await input.multipartUploads.complete({
      bucket: upload.bucket,
      key: upload.key,
      uploadId: upload.uploadId,
      parts
    });

    return {
      uploadId: upload.uploadId,
      bucket: upload.bucket,
      objectKey: upload.key,
      sizeBytes
    };
  } catch (error) {
    await input.multipartUploads.abort({
      bucket: upload.bucket,
      key: upload.key,
      uploadId: upload.uploadId
    });
    throw error;
  }
}
