export type QueryMeasure = {
  field: string;
  op: "sum" | "count" | "avg" | string;
};

export type QuerySpec = {
  tableName: string;
  dimensions: string[];
  measures: QueryMeasure[];
};
