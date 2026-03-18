import type { CanvasEnv } from "./env";

export type ServiceEndpoints = {
  databaseUrl: string;
  redisUrl: string;
  s3Endpoint: string;
};

export function buildServiceEndpoints(env: CanvasEnv): ServiceEndpoints {
  return {
    databaseUrl: env.DATABASE_URL,
    redisUrl: env.REDIS_URL,
    s3Endpoint: env.S3_ENDPOINT
  };
}
