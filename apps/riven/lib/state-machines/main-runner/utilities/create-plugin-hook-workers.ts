import { logger } from "@repo/core-util-logger";

import { type Queue, Worker } from "bullmq";
import os from "node:os";

import { createPluginWorker } from "../../../message-queue/utilities/create-plugin-worker.ts";

import type { ValidPlugin } from "../../plugin-registrar/actors/collect-plugins-for-registration.actor.ts";
import type { RivenEvent } from "@repo/util-plugin-sdk/events";

export function createPluginHookWorkers(plugins: Map<symbol, ValidPlugin>) {
  const pluginQueueMap = new Map<symbol, Map<RivenEvent["type"], Queue>>();
  const pluginWorkerMap = new Map<symbol, Map<RivenEvent["type"], Worker>>();
  const publishableEvents = new Set<RivenEvent["type"]>();

  for (const [pluginSymbol, { config, dataSources }] of plugins.entries()) {
    const queueMap = new Map<RivenEvent["type"], Queue>();
    const workerMap = new Map<RivenEvent["type"], Worker>();

    for (const [eventName, hook] of Object.entries(config.hooks)) {
      if (hook) {
        const { queue, worker } = createPluginWorker(
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
}
