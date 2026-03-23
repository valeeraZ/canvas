import { pathToFileURL } from "node:url";
import { createApiApp } from "./api/app";
import {
  createBackendRuntime,
  createBackendRuntimeConfig,
  startBackendRuntime
} from "./server";

export { createApiApp } from "./api/app";
export type { CreateApiAppOptions } from "./api/app";
export {
  createBackendRuntime,
  createBackendRuntimeConfig,
  startBackendRuntime
} from "./server";

async function run() {
  const runtime = await startBackendRuntime();

  const shutdown = async () => {
    await runtime.app.close();
    await runtime.db?.$disconnect();
    await runtime.cache?.disconnect();
  };

  process.on("SIGINT", async () => {
    await shutdown();
    process.exit(0);
  });

  process.on("SIGTERM", async () => {
    await shutdown();
    process.exit(0);
  });

  console.log(
    `Canvas backend listening at http://${runtime.config.host}:${runtime.config.port}`
  );
}

const entrypoint = process.argv[1];

if (entrypoint && import.meta.url === pathToFileURL(entrypoint).href) {
  run().catch((error: unknown) => {
    console.error("Failed to start Canvas backend", error);
    process.exit(1);
  });
}
