import {
  Episode,
  MediaEntry,
  MediaItem,
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
  return await database.em.fork().transactional(async (transaction) => {
    const existingItem = await transaction.getRepository(MediaItem).findOne(
      {
        streams: {
          infoHash: container.infoHash,
        },
        id,
      },
      {
        populate: ["streams.infoHash", "filesystemEntries:ref"],
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
      const matchedStream = existingItem.streams.find(
        ({ infoHash }) => infoHash === container.infoHash,
      );

      assert(
        matchedStream,
        new UnrecoverableError(
          `Media item with ID ${id.toString()} does not have a stream matching the torrent container's info hash`,
        ),
      );

      existingItem.activeStream = ref(matchedStream);

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
        const episodes = await transaction.getRepository(Episode).find({
          id: {
            $in: container.files.map((file) => file.matchedMediaItemId),
          },
        });

        assert(
          episodes.length === container.files.length,
          new UnrecoverableError(
            "Unable to find all matched media items from the torrent container",
          ),
        );

        const episodeMap = new Map<number, Episode>(
          episodes.map((episode) => [episode.id, episode]),
        );

        const processableStates = MediaItemState.exclude([
          "completed",
          "downloaded",
        ]);

        for (const file of container.files) {
          const episode = episodeMap.get(file.matchedMediaItemId);

          assert(
            episode,
            new UnrecoverableError(
              `File ${file.fileName} does not correspond to a valid episode`,
            ),
          );

          if (!processableStates.safeParse(episode.state).success) {
            logger.debug(
              `Skipping media entry creation for ${episode.fullTitle} due to "${episode.state}" state`,
            );

            continue;
          }

          episode.filesystemEntries.add(
            transaction.create(MediaEntry, {
              fileSize: file.fileSize,
              originalFilename: file.fileName,
              mediaItem: ref(episode),
              provider: processedBy,
              providerDownloadId: container.torrentId.toString(),
              downloadUrl: file.downloadUrl,
            }),
          );

          transaction.persist(episode);
        }
      }

      await validateOrReject(existingItem);

      await transaction.persist(existingItem).flush();

      return existingItem;
    } catch (error) {
      const errorMessage = z
        .union([z.instanceof(Error), z.array(z.instanceof(ValidationError))])
        .transform((error) => {
          if (Array.isArray(error)) {
            return error
              .map((err) =>
                err.constraints
                  ? Object.values(err.constraints).join("; ")
                  : "",
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
  });
}
