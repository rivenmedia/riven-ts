import { DelayedError, UnrecoverableError } from "bullmq";
import chalk from "chalk";
import assert from "node:assert";

import { createJobParentConfig } from "#message-queue/utilities/create-job-parent-config.ts";
import { filterChildrenValues } from "#message-queue/utilities/filter-children-values.ts";
import { getPluginEventSubscribers } from "#state-machines/main-runner/utilities/get-plugin-event-subscribers.ts";
import { logger } from "#utilities/logger/logger.ts";

import { findValidTorrentProcessorSchema } from "./find-valid-torrent.schema.ts";
import { attemptInfoHashDownload } from "./utilities/attempt-infohash-download.ts";
import { formatReattemptTime } from "./utilities/format-reattempt-time.ts";

import type { StreamService } from "#database/services/stream/stream.service.ts";
import type { FindValidTorrentFlow } from "./find-valid-torrent.schema.ts";
import type { RivenPlugin } from "@repo/util-plugin-sdk";
import type { MediaItem } from "@repo/util-plugin-sdk/dto/entities";
import type { Scope } from "@sentry/node";
import type { ParentOptions } from "bullmq";
import type { DateTime } from "luxon";

type FindValidTorrentJob = Parameters<
  FindValidTorrentFlow["processor"]
>[0]["job"];

export interface FindValidTorrentContext {
  job: FindValidTorrentJob;
  token: string;
  scope: Scope;
  mediaItem: MediaItem;
  infoHashes: string[];
  parent: ParentOptions;
  streamService: StreamService;
  availableDownloaders: RivenPlugin[];
  /**
   * When a plugin indicates that a provider is rate limited,
   * we use this to delay the job until the rate limit is expected to be lifted, to avoid unnecessary attempts that are likely to fail.
   */
  rateLimitReattemptDatetime: DateTime | null;
}

export interface InfoHashAttemptState {
  didEncounterRateLimit: boolean;
}

export const findValidTorrentProcessor =
  findValidTorrentProcessorSchema.implementAsync(
    async (
      { job, scope, token },
      { services: { mediaItemService, streamService }, plugins },
    ) => {
      assert.ok(token);

      const childrenValues = filterChildrenValues(
        await job.getChildrenValues(),
        "download-item.rank-streams",
      );

      const [rankedStreams] = Object.values(childrenValues);

      if (!rankedStreams?.length) {
        throw new UnrecoverableError(
          `No streams found that match the ranking criteria for ${job.data.itemTitle}`,
        );
      }

      const {
        data: { id: mediaItemId, failedInfoHashes },
      } = job;

      const mediaItem = await mediaItemService.getMediaItemById(mediaItemId);

      const infoHashes = rankedStreams.map((stream) => stream.hash);
      const uncheckedInfoHashes = new Set(infoHashes).difference(
        new Set(failedInfoHashes),
      );

      const context: FindValidTorrentContext = {
        job,
        token,
        scope,
        mediaItem,
        infoHashes,
        parent: createJobParentConfig(job),
        streamService,
        availableDownloaders: getPluginEventSubscribers(
          "riven.media-item.download.requested",
          plugins,
        ),
        rateLimitReattemptDatetime: null,
      };

      for (const infoHash of uncheckedInfoHashes) {
        scope.setTag("riven.info-hash", infoHash);

        const { result, didEncounterRateLimit } = await attemptInfoHashDownload(
          context,
          infoHash,
        );

        if (result) {
          return result;
        }

        if (!didEncounterRateLimit) {
          logger.debug(
            `Info hash ${chalk.bold(infoHash)} failed validation for all plugins for ${mediaItem.type} ${chalk.bold(mediaItem.fullTitle)}`,
          );

          await job.log(`${infoHash} failed validation for all plugins`);

          await job.updateData({
            ...job.data,
            failedInfoHashes: [...job.data.failedInfoHashes, infoHash],
          });
        }
      }

      const { rateLimitReattemptDatetime } = context;

      if (job.data.failedInfoHashes.length === infoHashes.length) {
        logger.info(
          `All info hashes failed validation for ${mediaItem.type} ${chalk.bold(mediaItem.fullTitle)}; all plugins have been exhausted.`,
        );
      } else if (rateLimitReattemptDatetime) {
        logger.info(
          `Some hashes for ${chalk.bold(mediaItem.fullTitle)} were unable to download due to rate limits. Retrying in ${formatReattemptTime(rateLimitReattemptDatetime)}.`,
        );

        await job.moveToDelayed(rateLimitReattemptDatetime.toMillis(), token);

        throw new DelayedError();
      }

      return null;
    },
  );
