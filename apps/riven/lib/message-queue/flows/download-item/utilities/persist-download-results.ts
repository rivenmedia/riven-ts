import { MediaEntry } from "@repo/util-plugin-sdk/dto/entities";
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

  if (!existingItem.streams[0]) {
    throw new UnrecoverableError(
      `Media item with ID ${id.toString()} has no streams`,
    );
  }

  assert(
    existingItem.state === "scraped",
    new MediaItemDownloadErrorIncorrectState({
      item: existingItem,
    }),
  );

  const em = database.em.fork();

  existingItem.activeStream = ref(existingItem.streams[0]);
  existingItem.state = "downloaded";

  switch (existingItem.type) {
    case "movie": {
      const [file] = container.files;

      if (!file) {
        throw new UnrecoverableError(
          `No files found in torrent container ${container.infoHash}`,
        );
      }

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

      break;
    }
    case "show": {
      let iteratedEpisodes = 0;

      for (const file of container.files) {
        const associatedMediaItem = await database.episode.findOneOrFail({
          absoluteNumber: ++iteratedEpisodes,
        });

        associatedMediaItem.filesystemEntries.add(
          em.create(MediaEntry, {
            fileSize: file.fileSize,
            originalFilename: file.fileName,
            mediaItem: associatedMediaItem,
            provider: processedBy,
            providerDownloadId: container.torrentId.toString(),
            downloadUrl: file.downloadUrl ?? null,
          }),
        );
      }

      break;
    }
  }

  try {
    await validateOrReject(existingItem);

    await em.flush();

    return await em.refreshOrFail(existingItem, {
      populate: ["*"],
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
