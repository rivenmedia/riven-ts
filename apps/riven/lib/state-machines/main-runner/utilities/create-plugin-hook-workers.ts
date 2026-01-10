import { logger } from "@repo/core-util-logger";

import { Worker } from "bullmq";
import os from "node:os";

import { createPluginWorker } from "../../../message-queue/utilities/create-plugin-worker.ts";

import type { PendingRunnerInvocationPlugin } from "../../plugin-registrar/actors/collect-plugins-for-registration.actor.ts";
import type { RivenEvent } from "@repo/util-plugin-sdk/events";

export function createPluginHookWorkers(
  plugins: Map<symbol, PendingRunnerInvocationPlugin>,
) {
  const pluginWorkerMap = new Map<symbol, Map<RivenEvent["type"], Worker>>();
  const publishableEvents = new Set<RivenEvent["type"]>();

  for (const [pluginSymbol, { config, dataSources }] of plugins.entries()) {
    const workerMap = new Map<RivenEvent["type"], Worker>();

    for (const [eventName, hook] of Object.entries(config.hooks)) {
      if (hook) {
        const worker = createPluginWorker(
          eventName as RivenEvent["type"],
          pluginSymbol.description ?? "unknown",
          async (job) => {
            return await hook({
              event: job.data as never,
              dataSources,
            });
          },
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
        workerMap.set(eventName as RivenEvent["type"], worker);
      }
    }

    pluginWorkerMap.set(pluginSymbol, workerMap);
  }

  return {
    pluginWorkers: pluginWorkerMap,
    publishableEvents,
  };
}
