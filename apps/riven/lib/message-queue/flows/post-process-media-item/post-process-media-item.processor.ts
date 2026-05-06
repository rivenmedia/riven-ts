import { ValidationError } from "@mikro-orm/core";
import { UnrecoverableError, WaitingChildrenError } from "bullmq";
import chalk from "chalk";
import { DateTime } from "luxon";
import assert from "node:assert";

import { getPluginEventSubscribers } from "../../../state-machines/main-runner/utilities/get-plugin-event-subscribers.ts";
import { logger } from "../../../utilities/logger/logger.ts";
import { createJobParentConfig } from "../../utilities/create-job-parent-config.ts";
import { postProcessMediaItemProcessorSchema } from "./post-process-media-item.schema.ts";
import { enqueueRequestSubtitles } from "./steps/request-subtitles/enqueue-request-subtitles.ts";

export const postProcessItemProcessor =
  postProcessMediaItemProcessorSchema.implementAsync(async function (
    { job, token },
    { services: { subtitlesService }, plugins },
  ) {
    assert(token, "Job token is required");

    const parent = createJobParentConfig(job);

    try {
      while (job.data.step !== "complete") {
        switch (job.data.step) {
          case "post-process": {
            logger.debug(
              `Post-processing ${chalk.bold(job.data.mediaItem.fullTitle)}`,
            );

            const subtitlesSubscribers = getPluginEventSubscribers(
              "riven.media-item.subtitle.requested",
              plugins,
            );

            if (subtitlesSubscribers.length > 0) {
              const items =
                await subtitlesService.getItemsForSubtitlesProcessing(
                  job.data.mediaItem.id,
                );

              for (const item of items) {
                await enqueueRequestSubtitles({
                  item,
                  subscribers: subtitlesSubscribers,
                  parent,
                });
              }
            }

            await job.updateData({
              ...job.data,
              step: "validate-post-process",
            });

            if (await job.moveToWaitingChildren(token)) {
              throw new WaitingChildrenError();
            }

            break;
          }
          case "validate-post-process": {
            const childFailures = await job.getIgnoredChildrenFailures();

            if (Object.keys(childFailures).length) {
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

      const duration = DateTime.fromMillis(job.timestamp)
        .diffNow(["seconds", "minutes", "hours", "days", "weeks"])
        .rescale()
        .negate()
        .toHuman({
          showZeros: false,
          maximumFractionDigits: 0,
          unitDisplay: "narrow",
        });

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
  });
