export type QueryMeasure = {
  field: string;
  op: "sum" | "count" | "avg" | string;
};

export type QuerySpec = {
  tenantId: string;
  datasetId: string;
  dimensions: string[];
  measures: QueryMeasure[];
};
