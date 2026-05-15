import { type ActorRefFrom, fromPromise } from "xstate";

import { logger } from "../../../utilities/logger/logger.ts";
import { keyvInstance } from "../../../utilities/redis-cache.ts";

import type { mainRunnerMachine } from "../../main-runner/index.ts";
import type { Worker } from "bullmq";

async function forceCloseWorker(worker: Worker) {
  try {
    await worker.close(true);

    logger.debug(`Worker ${worker.name} force-closed successfully.`);
  } catch (error) {
    logger.error(`Error force-closing worker ${worker.name}`, { err: error });
  }
}

function attemptGracefulShutdown(worker: Worker) {
  return new Promise<void>((resolve) => {
    logger.debug(`Attempting graceful shutdown of worker ${worker.name}...`);

    const signal = AbortSignal.timeout(10_000);

    const removeAbortListener = () => {
      signal.removeEventListener("abort", onAbort);
    };

    const forceClose = () => {
      void forceCloseWorker(worker).finally(() => {
        resolve();
      });
    };

    const onAbort = () => {
      logger.warn(
        `Worker ${worker.name} did not shut down within 10 seconds, forcing shutdown...`,
      );

      forceClose();
    };

    signal.addEventListener("abort", onAbort, { once: true });

    worker
      .close()
      .then(() => {
        removeAbortListener();

        logger.debug(`Worker ${worker.name} closed gracefully.`);

        resolve();
      })
      .catch((error: unknown) => {
        removeAbortListener();

        logger.error(
          `Error during graceful shutdown of worker ${worker.name}, forcing shutdown...`,
          { err: error },
        );

        forceClose();
      });
  });
}

export interface ShutdownInput {
  mainRunnerRef: ActorRefFrom<typeof mainRunnerMachine> | undefined;
}

export const shutdown = fromPromise<undefined, ShutdownInput>(
  async ({ input: { mainRunnerRef } }) => {
    if (!mainRunnerRef) {
      return;
    }

    const {
      context: {
        flowWorkers: flowWorkerMap,
        sandboxedWorkers: sandboxedWorkerMap,
        plugins,
      },
    } = mainRunnerRef.getSnapshot();

    const flowWorkers = Object.values(flowWorkerMap ?? {});
    const sandboxedWorkers = Object.values(sandboxedWorkerMap ?? {});

    // Close workers
    await Promise.all(
      flowWorkers.map(({ worker }) => attemptGracefulShutdown(worker)),
    );

    logger.debug("Flow workers closed");

    await Promise.all(
      sandboxedWorkers.map(({ worker }) => attemptGracefulShutdown(worker)),
    );

    logger.debug("Sandboxed workers closed");

    await Promise.all(
      plugins
        .values()
        .flatMap(({ dataSources }) =>
          dataSources.values().map(({ worker }) => forceCloseWorker(worker)),
        ),
    );

    logger.debug("Plugin workers closed");

    // Close the Redis instance
    try {
      await keyvInstance.disconnect();

      logger.debug("Keyv Redis connection closed.");
    } catch (error) {
      logger.error("Error closing Keyv Redis connection:", { err: error });
    }
  },
);
