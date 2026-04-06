import type {
  MultipartUploadCreateInput,
  MultipartUploadPart,
  MultipartUploadState,
  MultipartUploadDriver
} from "./types";

export function createMultipartUploadService(driver: MultipartUploadDriver) {
  return {
    create(input: MultipartUploadCreateInput) {
      return driver.createMultipartUpload(input);
    },
    uploadPart(input: MultipartUploadState & { partNumber: number; body: Buffer }) {
      return driver.uploadPart(input);
    },
    complete(input: MultipartUploadState & { parts: MultipartUploadPart[] }) {
      return driver.completeMultipartUpload(input);
    },
    abort(input: MultipartUploadState) {
      return driver.abortMultipartUpload(input);
    }
  };
}
