import { ValidationError } from "@mikro-orm/core";
import { UnrecoverableError } from "bullmq";
import chalk from "chalk";
import assert from "node:assert";

import { createJobParentConfig } from "#message-queue/utilities/create-job-parent-config.ts";
import { formatJobDuration } from "#message-queue/utilities/format-job-duration.ts";
import { maybeWaitForChildren } from "#message-queue/utilities/maybe-wait-for-children.ts";
import { logger } from "#utilities/logger/logger.ts";

import { postProcessMediaItemProcessorSchema } from "./post-process-media-item.schema.ts";
import { maybeEnqueueSubtitleRequests } from "./utilities/maybe-enqueue-subtitle-requests.ts";

export const postProcessItemProcessor =
  postProcessMediaItemProcessorSchema.implementAsync(
    async ({ job, token }, { services: { subtitlesService }, plugins }) => {
      assert.ok(token, "Job token is required");

      const parent = createJobParentConfig(job);

      try {
        while (job.data.step !== "complete") {
          switch (job.data.step) {
            case "post-process": {
              logger.debug(
                `Post-processing ${chalk.bold(job.data.mediaItem.fullTitle)}`,
              );

              await maybeEnqueueSubtitleRequests(
                job.data.mediaItem.id,
                subtitlesService,
                plugins,
                parent,
              );

              await job.updateData({
                ...job.data,
                step: "validate-post-process",
              });

              await maybeWaitForChildren(job, token);

              break;
            }
            case "validate-post-process": {
              const { ignored = 0 } = await job.getDependenciesCount({
                ignored: true,
              });

              if (ignored > 0) {
                logger.warn(
                  `Post-processing failed for ${chalk.bold(job.data.mediaItem.fullTitle)}`,
                );
              }

              await job.updateData({
                ...job.data,
                step: "complete",
              });
            }
          }
        }

        const duration = formatJobDuration(job.timestamp);

        logger.info(
          chalk.greenBright(
            `${chalk.bold(job.data.mediaItem.fullTitle)} post-processing completed in ${duration}`,
          ),
        );
      } catch (error) {
        if (error instanceof ValidationError) {
          throw new UnrecoverableError(error.message);
        }

        throw error;
      }
    },
  );
