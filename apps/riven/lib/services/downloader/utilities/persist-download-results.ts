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

import { type EntityManager, NotFoundError, ref } from "@mikro-orm/core";
import { ValidationError, validateOrReject } from "class-validator";
import assert from "node:assert";
import z from "zod";

import type { ValidTorrent } from "../../../message-queue/flows/download-item/steps/find-valid-torrent/find-valid-torrent.schema.ts";
import type { UUID } from "node:crypto";

export async function persistDownloadResults(
  em: EntityManager,
  id: UUID,
  torrent: ValidTorrent,
  processedBy: string,
) {
  const existingItem = await em.getRepository(MediaItem).findOne(
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
    new NotFoundError(
      `No media item found with ID ${id} and stream info hash ${torrent.infoHash}`,
    ),
  );

  const processableStates = MediaItemState.extract([
    "scraped",
    "ongoing",
    "partially_completed",
  ]);

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
      new NotFoundError(
        `Media item with ID ${id} does not have a stream matching the torrent's info hash ${torrent.infoHash}`,
      ),
    );

    existingItem.activeStream = ref(matchedStream);

    if (existingItem instanceof Movie || existingItem instanceof Episode) {
      const [file] = torrent.files;

      assert(file?.link, "Download URL is missing for the matched file");

      existingItem.filesystemEntries.add(
        em.create(MediaEntry, {
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
      const episodes = await em.getRepository(Episode).find({
        id: {
          $in: torrent.files.map((file) => file.matchedMediaItemId),
        },
      });

      assert(
        episodes.length === torrent.files.length,
        new NotFoundError(
          "Unable to find all matched media items from the torrent",
        ),
      );

      const episodeMap = new Map<string, Episode>(
        episodes.map((episode) => [episode.id, episode]),
      );

      const processableStates = MediaItemState.exclude([
        "completed",
        "downloaded",
      ]);

      for (const file of torrent.files) {
        assert(file.link, "Download URL is missing for the matched file");

        const episode = episodeMap.get(file.matchedMediaItemId);

        assert(
          episode,
          new NotFoundError(
            `File ${file.name} does not correspond to a valid episode`,
          ),
        );

        if (!processableStates.safeParse(episode.state).success) {
          const { logger } =
            await import("../../../utilities/logger/logger.ts");

          logger.debug(
            `Skipping media entry creation for ${episode.fullTitle} due to "${episode.state}" state`,
          );

          continue;
        }

        episode.filesystemEntries.add(
          em.create(MediaEntry, {
            fileSize: file.size,
            originalFilename: file.name,
            mediaItem: ref(episode),
            provider: torrent.provider,
            providerDownloadId: torrent.torrentId,
            downloadUrl: file.link,
            plugin: processedBy,
          }),
        );
      }
    }

    await validateOrReject(existingItem);

    return existingItem;
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
