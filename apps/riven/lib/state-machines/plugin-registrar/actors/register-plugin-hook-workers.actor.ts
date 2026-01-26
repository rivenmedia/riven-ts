import { logger } from "@repo/core-util-logger";

import { type Queue, Worker } from "bullmq";
import os from "node:os";
import { fromPromise } from "xstate";

import { createPluginWorker } from "../../../message-queue/utilities/create-plugin-worker.ts";

import type { ValidPlugin } from "./collect-plugins-for-registration.actor.ts";
import type { RivenEvent } from "@repo/util-plugin-sdk/events";

export interface RegisterPluginHookWorkersInput {
  plugins: Map<symbol, ValidPlugin>;
}

export interface RegisterPluginHookWorkersOutput {
  pluginQueues: Map<symbol, Map<RivenEvent["type"], Queue>>;
  pluginWorkers: Map<symbol, Map<RivenEvent["type"], Worker>>;
  publishableEvents: Set<RivenEvent["type"]>;
}

export const registerPluginHookWorkers = fromPromise<
  RegisterPluginHookWorkersOutput,
  RegisterPluginHookWorkersInput
>(async ({ input: { plugins } }) => {
  const pluginQueueMap = new Map<symbol, Map<RivenEvent["type"], Queue>>();
  const pluginWorkerMap = new Map<symbol, Map<RivenEvent["type"], Worker>>();
  const publishableEvents = new Set<RivenEvent["type"]>();

  for (const [pluginSymbol, { config, dataSources }] of plugins.entries()) {
    const queueMap = new Map<RivenEvent["type"], Queue>();
    const workerMap = new Map<RivenEvent["type"], Worker>();

    for (const [eventName, hook] of Object.entries(config.hooks)) {
      if (hook) {
        const { queue, worker } = await createPluginWorker(
          eventName as RivenEvent["type"],
          pluginSymbol.description ?? "unknown",
          async (job) =>
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
