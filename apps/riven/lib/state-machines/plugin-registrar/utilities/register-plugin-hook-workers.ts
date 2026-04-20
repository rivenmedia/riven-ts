import { type Queue, Worker } from "bullmq";
import chalk from "chalk";

import { createPluginWorker } from "../../../message-queue/utilities/create-plugin-worker.ts";
import { logger } from "../../../utilities/logger/logger.ts";
import { eventSerialiserSchemaMap } from "../../../utilities/serialisers/event-serialiser-schemas.ts";

import type {
  PluginQueueMap,
  PluginWorkerMap,
  PublishableEventSet,
  ValidPluginMap,
} from "../../../types/plugins.ts";
import type { RivenEvent } from "@repo/util-plugin-sdk/events";
import type { PluginSettings } from "@repo/util-plugin-sdk/utilities/plugin-settings";

export interface RegisterPluginHookWorkersOutput {
  pluginQueues: PluginQueueMap;
  pluginWorkers: PluginWorkerMap;
  publishableEvents: PublishableEventSet;
}

export const registerPluginHookWorkers = (
  plugins: ValidPluginMap,
  settings: PluginSettings,
) => {
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
        const typedEventName = eventName as RivenEvent["type"];
        const pluginName = pluginSymbol.description ?? "unknown";

        const { queue, worker } = createPluginWorker(
          typedEventName,
          pluginName,
          async (job) => {
            const eventSchemaWithDeserialiser =
              eventSerialiserSchemaMap.get(typedEventName);

            if (!eventSchemaWithDeserialiser) {
              throw new Error(
                `No deserialiser schema found for event type "${typedEventName}"`,
              );
            }

            const event = await eventSchemaWithDeserialiser
              .omit({ type: true })
              .decodeAsync(job.data);

            return hook({
              event: event as never,
              dataSources,
              settings,
              logger,
            });
          },
          { concurrency: 1 },
        );

        logger.debug(
          `Registered worker for event ${chalk.blue(eventName)} for ${chalk.bold(
            String(pluginSymbol.description),
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
  } satisfies RegisterPluginHookWorkersOutput;
};
