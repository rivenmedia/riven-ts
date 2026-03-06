import {
  Episode,
  MediaEntry,
  Movie,
  Season,
  Show,
} from "@repo/util-plugin-sdk/dto/entities";
import { MediaItemState } from "@repo/util-plugin-sdk/dto/enums/media-item-state.enum";
import { MediaItemDownloadError } from "@repo/util-plugin-sdk/schemas/events/media-item.download.error.event";
import { MediaItemDownloadErrorIncorrectState } from "@repo/util-plugin-sdk/schemas/events/media-item.download.incorrect-state.event";

import { ref } from "@mikro-orm/core";
import { UnrecoverableError } from "bullmq";
import { ValidationError, validateOrReject } from "class-validator";
import assert from "node:assert";
import z from "zod";

import { database } from "../../../../database/database.ts";
import { logger } from "../../../../utilities/logger/logger.ts";

import type { ValidTorrentContainer } from "../steps/find-valid-torrent-container/find-valid-torrent-container.schema.ts";

export interface PersistDownloadResultsInput {
  id: number;
  container: ValidTorrentContainer;
  processedBy: string;
}

export async function persistDownloadResults({
  id,
  container,
  processedBy,
}: PersistDownloadResultsInput) {
  const existingItem = await database.mediaItem.findOne(
    {
      streams: {
        infoHash: container.infoHash,
      },
      id,
    },
    {
      populate: ["streams:ref", "filesystemEntries:ref"],
    },
  );

  assert(
    existingItem,
    new UnrecoverableError(`Media item with ID ${id.toString()} not found`),
  );

  const allowedStates: MediaItemState[] = ["scraped", "ongoing"];

  assert(
    allowedStates.includes(existingItem.state),
    new MediaItemDownloadErrorIncorrectState({
      item: existingItem,
    }),
  );

  try {
    return await database.em.fork().transactional(async (transaction) => {
      assert(
        existingItem.streams[0],
        new UnrecoverableError(
          `Media item with ID ${id.toString()} has no streams`,
        ),
      );

      existingItem.activeStream = ref(existingItem.streams[0]);

      if (existingItem instanceof Movie || existingItem instanceof Episode) {
        const [file] = container.files;

        existingItem.filesystemEntries.add(
          transaction.create(MediaEntry, {
            fileSize: file.fileSize,
            originalFilename: file.fileName,
            mediaItem: ref(existingItem),
            provider: processedBy,
            providerDownloadId: container.torrentId.toString(),
            downloadUrl: file.downloadUrl,
          }),
        );
      }

      if (existingItem instanceof Show || existingItem instanceof Season) {
        const episodes =
          existingItem instanceof Show
            ? await existingItem.getEpisodes()
            : await existingItem.episodes.loadItems();

        assert(episodes[0]);

        for (const file of container.files) {
          assert(
            file.type === "show",
            `Expected file type "show", got "${file.type}"`,
          );

          const episode = await database.episode.findAbsoluteEpisode(
            existingItem.tvdbId,
            file.episode,
            file.season,
          );

          assert(
            episode,
            `File ${file.fileName} does not correspond to a valid episode`,
          );

          const ignoredStates = MediaItemState.exclude([
            "completed",
            "downloaded",
          ]);

          if (!ignoredStates.safeParse(episode.state).success) {
            continue;
          }

          const existingMediaEntries = await episode.getMediaEntries();

          if (existingMediaEntries.length) {
            logger.debug(
              `${episode.fullTitle} already has media entries, skipping...`,
            );

            continue;
          }

          episode.filesystemEntries.add(
            transaction.create(MediaEntry, {
              fileSize: file.fileSize,
              originalFilename: file.fileName,
              mediaItem: episode,
              provider: processedBy,
              providerDownloadId: container.torrentId.toString(),
              downloadUrl: file.downloadUrl,
            }),
          );
        }
      }

      await validateOrReject(existingItem);

      return existingItem;
    });
  } catch (error) {
    const errorMessage = z
      .union([z.instanceof(Error), z.array(z.instanceof(ValidationError))])
      .transform((error) => {
        if (Array.isArray(error)) {
          return error
            .map((err) =>
              err.constraints ? Object.values(err.constraints).join("; ") : "",
            )
            .join("; ");
        }

        return error.message;
      })
      .parse(error);

    throw new MediaItemDownloadError({
      item: existingItem,
      error: errorMessage,
    });
  }
}
