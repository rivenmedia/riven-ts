import { type ActorRefFrom, fromPromise } from "xstate";

import { logger } from "../../../utilities/logger/logger.ts";
import { keyvInstance } from "../../../utilities/redis-cache.ts";

import type { mainRunnerMachine } from "../../main-runner/index.ts";

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
        pluginWorkers: pluginWorkerMap,
        pluginQueues: pluginQueueMap,
        plugins,
      },
    } = mainRunnerRef.getSnapshot();

    const flowWorkers = Object.values(flowWorkerMap);
    const sandboxedWorkers = Object.values(sandboxedWorkerMap);

    // Pause queues first to prevent them from picking up more jobs whilst we are shutting down
    await Promise.all(flowWorkers.map(({ queue }) => queue.pause()));
    await Promise.all(sandboxedWorkers.map(({ queue }) => queue.pause()));
    await Promise.all(
      pluginQueueMap
        .values()
        .flatMap((eventMap) => eventMap.values().map((queue) => queue.pause())),
    );
    await Promise.all(
      plugins
        .values()
        .flatMap((plugin) =>
          plugin.dataSources
            .values()
            .map((dataSource) => dataSource.queue.pause()),
        ),
    );

    logger.debug("All queues paused, cancelling jobs and closing workers...");

    // Cancel all jobs currently being processed. This aborts the signal on each job.
    for (const { worker } of sandboxedWorkers) {
      worker.cancelAllJobs();
    }

    for (const { worker } of flowWorkers) {
      worker.cancelAllJobs();
    }

    for (const eventMap of pluginWorkerMap.values()) {
      for (const worker of eventMap.values()) {
        worker.cancelAllJobs();
      }
    }

    for (const plugin of plugins.values()) {
      for (const [, dataSource] of plugin.dataSources) {
        dataSource.worker.cancelAllJobs();
      }
    }

    logger.debug("All jobs cancelled, closing workers and queues...");

    // Close workers and queues
    for (const { queue, worker } of flowWorkers) {
      await worker.close();
      await queue.close();
    }

    logger.debug("Flow workers and queues closed");

    for (const { queue, worker } of sandboxedWorkers) {
      await worker.close();
      await queue.close();
    }

    logger.debug("Sandboxed workers and queues closed");

    for (const plugin of plugins.values()) {
      for (const [, dataSource] of plugin.dataSources) {
        await dataSource.worker.close(true); // Force close datasource workers to prevent waits when rate-limited
        await dataSource.queue.close();
      }
    }

    logger.debug("Plugin workers and queues closed");

    // Close the Redis instance
    try {
      await keyvInstance.disconnect();

      logger.debug("Keyv Redis connection closed.");
    } catch (error) {
      logger.error("Error closing Keyv Redis connection:", { err: error });
    }
  },
);
