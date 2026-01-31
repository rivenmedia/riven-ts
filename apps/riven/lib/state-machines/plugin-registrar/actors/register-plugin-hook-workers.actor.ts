import { logger } from "@repo/core-util-logger";

import { type Queue, Worker } from "bullmq";
import os from "node:os";
import { fromPromise } from "xstate";

import { createPluginWorker } from "../../../message-queue/utilities/create-plugin-worker.ts";

import type {
  PluginQueueMap,
  PluginWorkerMap,
  PublishableEventSet,
  ValidPluginMap,
} from "../../../types/plugins.ts";
import type { RivenEvent } from "@repo/util-plugin-sdk/events";

export interface RegisterPluginHookWorkersInput {
  plugins: ValidPluginMap;
}

export interface RegisterPluginHookWorkersOutput {
  pluginQueues: PluginQueueMap;
  pluginWorkers: PluginWorkerMap;
  publishableEvents: PublishableEventSet;
}

export const registerPluginHookWorkers = fromPromise<
  RegisterPluginHookWorkersOutput,
  RegisterPluginHookWorkersInput
>(async ({ input: { plugins } }) => {
  const pluginQueueMap = new Map<
    symbol,
    Map<RivenEvent["type"], Queue>
  >() satisfies PluginQueueMap;

  const pluginWorkerMap = new Map<
    symbol,
    Map<RivenEvent["type"], Worker>
  >() satisfies PluginWorkerMap;

  const publishableEvents = new Set<
    RivenEvent["type"]
  >() satisfies PublishableEventSet;

  for (const [pluginSymbol, { config, dataSources }] of plugins.entries()) {
    const queueMap = new Map<RivenEvent["type"], Queue>();
    const workerMap = new Map<RivenEvent["type"], Worker>();

    for (const [eventName, hook] of Object.entries(config.hooks)) {
      if (hook) {
        const { queue, worker } = await createPluginWorker(
          eventName as RivenEvent["type"],
          pluginSymbol.description ?? "unknown",
          (job) =>
            hook({
              event: job.data as never,
              dataSources,
            }) as Promise<never>,
          { concurrency: os.availableParallelism() },
          {
            telemetry: {
              tracerName: `riven-plugin-${pluginSymbol.description ?? "unknown"}`,
              version: config.version,
            },
          },
        );

        logger.debug(
          `Registered worker for event "${eventName}" for plugin ${String(
            pluginSymbol.description,
          )}`,
        );

        publishableEvents.add(eventName as RivenEvent["type"]);

        queueMap.set(eventName as RivenEvent["type"], queue);
        workerMap.set(eventName as RivenEvent["type"], worker);
      } else {
        logger.silly(
          `No hook defined for event "${eventName}" for plugin ${String(
            pluginSymbol.description,
          )}, skipping worker registration.`,
        );
      }
    }

    pluginQueueMap.set(pluginSymbol, queueMap);
    pluginWorkerMap.set(pluginSymbol, workerMap);
  }

  return {
    pluginQueues: pluginQueueMap,
    pluginWorkers: pluginWorkerMap,
    publishableEvents,
  };
});
