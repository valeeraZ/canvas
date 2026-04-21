import type { ExpiringStore } from "../../../../../../packages/auth/src/index.js";
import { normalizeRows } from "../../ingestion/normalize/normalize-rows";
import { parseCsv } from "../../ingestion/parsers/csv";

export type DatasetContentRow = Record<string, string | number | boolean | null>;

export type DatasetContent = {
  datasetId: string;
  rows: DatasetContentRow[];
};

type ObjectReader = {
  read(input: {
    bucket: string;
    key: string;
  }): Promise<{
    bucket: string;
    key: string;
    body: Buffer;
  }>;
};

function createCacheKey(input: {
  tenantId: string;
  datasetId: string;
  objectKey: string;
}) {
  return `canvas:dataset-content:${input.tenantId}:${input.datasetId}:${input.objectKey}`;
}

function rowsToRecords(input: {
  headers: string[];
  rows: Array<Array<string | number | boolean | null>>;
}) {
  return input.rows.map((row) =>
    input.headers.reduce<DatasetContentRow>((record, header, index) => {
      record[header] = row[index] ?? null;
      return record;
    }, {})
  );
}

export function createDatasetContentLoader(input: {
  cache: ExpiringStore;
  objectReader: ObjectReader;
  ttlSeconds?: number;
}) {
  const ttlSeconds = input.ttlSeconds ?? 900;
  const inFlight = new Map<string, Promise<DatasetContent>>();

  async function hydrate(loadInput: {
    tenantId: string;
    datasetId: string;
    bucket: string;
    objectKey: string;
  }) {
    const cached = await input.cache.get(createCacheKey(loadInput));

    if (cached) {
      return JSON.parse(cached) as DatasetContent;
    }

    const object = await input.objectReader.read({
      bucket: loadInput.bucket,
      key: loadInput.objectKey
    });
    const content = object.body.toString("utf8");

    if (content.trim().length === 0) {
      throw new Error("Dataset source file is empty");
    }

    const normalized = normalizeRows(parseCsv(content));
    const datasetContent = {
      datasetId: loadInput.datasetId,
      rows: rowsToRecords(normalized)
    } satisfies DatasetContent;

    await input.cache.set(
      createCacheKey(loadInput),
      JSON.stringify(datasetContent),
      ttlSeconds
    );

    return datasetContent;
  }

  return {
    load(loadInput: {
      tenantId: string;
      datasetId: string;
      bucket: string;
      objectKey: string;
    }) {
      const cacheKey = createCacheKey(loadInput);
      const existing = inFlight.get(cacheKey);

      if (existing) {
        return existing;
      }

      const promise = hydrate(loadInput).finally(() => {
        inFlight.delete(cacheKey);
      });
      inFlight.set(cacheKey, promise);

      return promise;
    }
  };
}
