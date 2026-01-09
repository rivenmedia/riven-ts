import { logger } from "@repo/core-util-logger";

import { type Queue, Worker } from "bullmq";
import os from "node:os";

import { createWorker } from "../../../message-queue/utilities/create-worker.ts";

import type { PendingRunnerInvocationPlugin } from "../../plugin-registrar/actors/collect-plugins-for-registration.actor.ts";
import type { RivenEvent } from "@repo/util-plugin-sdk";
import type { ProgramToPluginEvent } from "@repo/util-plugin-sdk/program-to-plugin-events";

export function createPluginHookWorkers(
  plugins: Map<symbol, PendingRunnerInvocationPlugin>,
  queues: Map<RivenEvent["type"], Queue>,
) {
  const pluginWorkerMap = new Map<
    symbol,
    Map<ProgramToPluginEvent["type"], Worker>
  >();
  const publishableEvents = new Set<RivenEvent["type"]>();

  for (const [pluginSymbol, { config, dataSources }] of plugins.entries()) {
    const workerMap = new Map<ProgramToPluginEvent["type"], Worker>();

    for (const [eventName, hook] of Object.entries(config.hooks)) {
      if (hook) {
        const worker = createWorker(
          eventName as ProgramToPluginEvent["type"],
          async (job) => {
            const result = await hook({
              event: {
                type: job.name,
                ...job.data,
              } as never,
              dataSources,
              async publishEvent({ type, ...event }) {
                const queueForEvent = queues.get(type);

                if (!queueForEvent) {
                  throw new Error(`Event queue for ${type} not found`);
                }

                await queueForEvent.add(type, {
                  ...event,
                  plugin: pluginSymbol.description,
                });
              },
            });

            return {
              plugin: pluginSymbol,
              result,
            };
          },
          {
            concurrency: os.availableParallelism(),
          },
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
        workerMap.set(eventName as ProgramToPluginEvent["type"], worker);
      }
    }

    pluginWorkerMap.set(pluginSymbol, workerMap);
  }

  return {
    pluginWorkers: pluginWorkerMap,
    publishableEvents,
  };
}
