import { RivenEvent } from "@repo/util-plugin-sdk/events";

import chalk from "chalk";
import { fromCallback } from "xstate";

import { flow } from "../../../message-queue/flows/producer.ts";
import { extractPluginNameFromJobId } from "../../../message-queue/utilities/extract-plugin-name-from-job-id.ts";
import { logger } from "../../../utilities/logger/logger.ts";
import { serialiseEventData } from "../../../utilities/serialisers/serialise-event-data.ts";

import type { PluginQueueMap, ValidPluginMap } from "../../../types/plugins.ts";
import type { FlowJob } from "bullmq";

export interface JobEnqueuerInput {
  plugins: ValidPluginMap;
  pluginQueues: PluginQueueMap;
}

export const jobEnqueuer = fromCallback<RivenEvent, JobEnqueuerInput>(
  ({ receive, input: { plugins, pluginQueues } }) => {
    receive(({ type, ...event }) => {
      const jobs = plugins.values().reduce<FlowJob[]>((acc, plugin) => {
        const queue = pluginQueues.get(plugin.config.name)?.get(type);

        if (!queue) {
          logger.silly(
            `No queue found for event "${type}" and plugin "${plugin.config.name.description ?? "unknown"}". Event will not be broadcast to this plugin.`,
          );

          return acc;
        }

        return [
          ...acc,
          {
            name: type,
            queueName: queue.name,
            data: serialiseEventData(type, event),
          },
        ];
      }, []);

      if (jobs.length === 0) {
        logger.silly(
          `No plugins have registered hooks for event "${type}". Event will not be broadcast to any plugins.`,
        );

        return;
      }

      logger.debug(
        `Enqueuing event ${chalk.blue(type)} for ${jobs.map((job) => chalk.bold(extractPluginNameFromJobId(job.queueName))).join(", ")}`,
      );

      flow
        .addBulk(jobs)
        .then((addedJobs) => {
          logger.silly(
            `Successfully enqueued ${chalk.blue(type)} for ${addedJobs.length.toString()} plugins.`,
          );
        })
        .catch((error: unknown) => {
          logger.error(`Failed to enqueue event ${chalk.red(type)}`, {
            err: error,
          });
        });
    });
  },
);
