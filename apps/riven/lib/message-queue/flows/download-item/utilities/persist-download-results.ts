import {
  Episode,
  MediaEntry,
  Movie,
  Season,
  Show,
} from "@repo/util-plugin-sdk/dto/entities";
import { MediaItemDownloadError } from "@repo/util-plugin-sdk/schemas/events/media-item.download.error.event";
import { MediaItemDownloadErrorIncorrectState } from "@repo/util-plugin-sdk/schemas/events/media-item.download.incorrect-state.event";

import { ref } from "@mikro-orm/core";
import { UnrecoverableError } from "bullmq";
import { ValidationError, validateOrReject } from "class-validator";
import assert from "node:assert";
import z from "zod";

import { database } from "../../../../database/database.ts";

import type { TorrentContainer } from "@repo/util-plugin-sdk/schemas/torrents/torrent-container";

export interface PersistDownloadResultsInput {
  id: number;
  container: TorrentContainer;
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

  assert(
    existingItem.streams[0],
    new UnrecoverableError(
      `Media item with ID ${id.toString()} has no streams`,
    ),
  );

  assert(
    existingItem.state === "scraped",
    new MediaItemDownloadErrorIncorrectState({
      item: existingItem,
    }),
  );

  const em = database.em.fork();

  existingItem.activeStream = ref(existingItem.streams[0]);
  existingItem.state = "downloaded";

  if (existingItem instanceof Movie || existingItem instanceof Episode) {
    const [file] = container.files;

    existingItem.filesystemEntries.add(
      em.create(MediaEntry, {
        fileSize: file.fileSize,
        originalFilename: file.fileName,
        mediaItem: ref(existingItem),
        provider: processedBy,
        providerDownloadId: container.torrentId.toString(),
        downloadUrl: file.downloadUrl ?? null,
      }),
    );
  }

  if (existingItem instanceof Show || existingItem instanceof Season) {
    const episodes =
      existingItem instanceof Show
        ? await existingItem.getEpisodes()
        : await existingItem.episodes.loadItems();

    assert(episodes[0]);

    let episodeNumber = episodes[0].absoluteNumber;

    for (const file of container.files) {
      const episode = await database.episode.findOneOrFail({
        absoluteNumber: episodeNumber++,
      });

      episode.filesystemEntries.add(
        em.create(MediaEntry, {
          fileSize: file.fileSize,
          originalFilename: file.fileName,
          mediaItem: episode,
          provider: processedBy,
          providerDownloadId: container.torrentId.toString(),
          downloadUrl: file.downloadUrl ?? null,
        }),
      );
    }
  }

  try {
    await validateOrReject(existingItem);

    await em.persist(existingItem).flush();

    await em.refreshOrFail(existingItem, {
      populate: ["*"],
    });

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
