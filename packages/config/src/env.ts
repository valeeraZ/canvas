export type CanvasEnv = {
  DATABASE_URL: string;
  REDIS_URL: string;
  S3_ENDPOINT: string;
};

export function loadEnv(source: Record<string, string | undefined>): CanvasEnv {
  const required = ["DATABASE_URL", "REDIS_URL", "S3_ENDPOINT"] as const;

  for (const key of required) {
    if (!source[key]) {
      throw new Error(`Missing env: ${key}`);
    }
  }

  return {
    DATABASE_URL: source.DATABASE_URL!,
    REDIS_URL: source.REDIS_URL!,
    S3_ENDPOINT: source.S3_ENDPOINT!
  };
}
