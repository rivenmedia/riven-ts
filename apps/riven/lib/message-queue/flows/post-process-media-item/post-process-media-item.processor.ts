import { ValidationError } from "@mikro-orm/core";
import { UnrecoverableError } from "bullmq";
import chalk from "chalk";
import assert from "node:assert";

import { getPluginEventSubscribers } from "../../../state-machines/main-runner/utilities/get-plugin-event-subscribers.ts";
import { logger } from "../../../utilities/logger/logger.ts";
import { createJobParentConfig } from "../../utilities/create-job-parent-config.ts";
import { formatJobDuration } from "../../utilities/format-job-duration.ts";
import { maybeWaitForChildren } from "../../utilities/maybe-wait-for-children.ts";
import { postProcessMediaItemProcessorSchema } from "./post-process-media-item.schema.ts";
import { enqueueRequestSubtitles } from "./steps/request-subtitles/enqueue-request-subtitles.ts";

import type { SubtitlesService } from "../../../database/services/subtitles/subtitles.service.ts";
import type { ValidPluginMap } from "../../../types/plugins.ts";
import type { ParentOptions } from "bullmq";
import type { UUID } from "node:crypto";

async function maybeEnqueueSubtitleRequests(
  mediaItemId: UUID,
  subtitlesService: SubtitlesService,
  plugins: ValidPluginMap,
  parent: ParentOptions,
) {
  const subtitlesSubscribers = getPluginEventSubscribers(
    "riven.media-item.subtitle.requested",
    plugins,
  );

  if (subtitlesSubscribers.length === 0) {
    return;
  }

  const items =
    await subtitlesService.getItemsForSubtitlesProcessing(mediaItemId);

  for (const item of items) {
    await enqueueRequestSubtitles({
      item,
      subscribers: subtitlesSubscribers,
      parent,
    });
  }
}

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
