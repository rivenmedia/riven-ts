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

import type { ValidTorrent } from "../steps/find-valid-torrent/find-valid-torrent.schema.ts";
import type { UUID } from "node:crypto";

const processableStates = MediaItemState.extract([
  "scraped",
  "ongoing",
  "partially_completed",
]);

const processableEpisodeStates = MediaItemState.exclude([
  "completed",
  "downloaded",
]);

export interface PersistDownloadResultsInput {
  id: UUID;
  torrent: ValidTorrent;
  processedBy: string;
}

export async function persistDownloadResults({
  id,
  torrent,
  processedBy,
}: PersistDownloadResultsInput) {
  return await database.em.fork().transactional(async (transaction) => {
    const existingItem = await transaction.getRepository(MediaItem).findOne(
      {
        streams: {
          infoHash: torrent.infoHash,
        },
        id,
      },
      {
        populate: ["streams.infoHash", "filesystemEntries:ref"],
      },
    );

    assert(
      existingItem,
      new UnrecoverableError(
        `No media item found with ID ${id} and stream info hash ${torrent.infoHash}`,
      ),
    );

    assert(
      processableStates.safeParse(existingItem.state).success,
      new MediaItemDownloadErrorIncorrectState({
        item: existingItem,
      }),
    );

    try {
      const matchedStream = existingItem.streams.find(
        ({ infoHash }) => infoHash === torrent.infoHash,
      );

      assert(
        matchedStream,
        new UnrecoverableError(
          `Media item with ID ${id} does not have a stream matching the torrent's info hash ${torrent.infoHash}`,
        ),
      );

      existingItem.activeStream = ref(matchedStream);

      if (existingItem instanceof Movie || existingItem instanceof Episode) {
        const [file] = torrent.files;

        assert(file?.link, "Download URL is missing for the matched file");

        existingItem.filesystemEntries.add(
          transaction.create(MediaEntry, {
            fileSize: file.size,
            originalFilename: file.name,
            mediaItem: ref(existingItem),
            provider: torrent.provider,
            providerDownloadId: torrent.torrentId,
            downloadUrl: file.link,
            plugin: processedBy,
          }),
        );
      }

      if (existingItem instanceof Show || existingItem instanceof Season) {
        const episodes = await transaction.getRepository(Episode).find({
          id: {
            $in: torrent.files.map((file) => file.matchedMediaItemId),
          },
        });

        assert(
          episodes.length === torrent.files.length,
          new UnrecoverableError(
            "Unable to find all matched media items from the torrent",
          ),
        );

        const episodeMap = new Map<string, Episode>(
          episodes.map((episode) => [episode.id, episode]),
        );

        for (const file of torrent.files) {
          assert(file.link, "Download URL is missing for the matched file");

          const episode = episodeMap.get(file.matchedMediaItemId);

          assert(
            episode,
            new UnrecoverableError(
              `File ${file.name} does not correspond to a valid episode`,
            ),
          );

          if (!processableEpisodeStates.safeParse(episode.state).success) {
            logger.debug(
              `Skipping media entry creation for ${episode.fullTitle} due to "${episode.state}" state`,
            );

            continue;
          }

          episode.filesystemEntries.add(
            transaction.create(MediaEntry, {
              fileSize: file.size,
              originalFilename: file.name,
              mediaItem: ref(episode),
              provider: torrent.provider,
              providerDownloadId: torrent.torrentId,
              downloadUrl: file.link,
              plugin: processedBy,
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
