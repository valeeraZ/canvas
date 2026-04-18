export type StorageObjectReaderDriver = {
  getObject: (input: {
    bucket: string;
    key: string;
  }) => Promise<{
    bucket: string;
    key: string;
    body: Buffer;
  }>;
};

export function createObjectReader(driver: StorageObjectReaderDriver) {
  return {
    read(input: {
      bucket: string;
      key: string;
    }) {
      return driver.getObject(input);
    }
  };
}
