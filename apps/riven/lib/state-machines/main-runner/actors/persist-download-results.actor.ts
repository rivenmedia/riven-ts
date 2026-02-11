import { MediaEntry } from "@repo/util-plugin-sdk/dto/entities";

import { ref } from "@mikro-orm/core";
import { ValidationError, validateOrReject } from "class-validator";
import z from "zod";

import { database } from "../../../database/database.ts";

import type { MainRunnerMachineIntake } from "../index.ts";
import type { TorrentContainer } from "@repo/util-plugin-sdk/schemas/torrents/torrent-container";

export interface PersistDownloadResultsInput {
  id: number;
  container: TorrentContainer;
  processedBy: string;
  sendEvent: MainRunnerMachineIntake;
}

export async function persistDownloadResults({
  id,
  container,
  processedBy,
  sendEvent,
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

  if (!existingItem) {
    throw new Error(`Media item with ID ${id.toString()} not found`);
  }

  if (!existingItem.streams[0]) {
    throw new Error(`Media item with ID ${id.toString()} has no streams`);
  }

  if (existingItem.state !== "scraped") {
    sendEvent({
      type: "riven.media-item.download.error.incorrect-state",
      item: existingItem,
    });

    return;
  }

  const em = database.em.fork();

  existingItem.activeStream = ref(existingItem.streams[0]);
  existingItem.state = "downloaded";

  switch (existingItem.type) {
    case "movie": {
      const [file] = container.files;

      if (!file) {
        throw new Error(
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
    const parsedError = z
      .union([z.instanceof(Error), z.array(z.instanceof(ValidationError))])
      .parse(error);

    sendEvent({
      type: "riven.media-item.download.error",
      item: existingItem,
      error: Array.isArray(parsedError)
        ? parsedError
            .map((err) =>
              err.constraints ? Object.values(err.constraints).join("; ") : "",
            )
            .join("; ")
        : parsedError.message,
    });

    throw error;
  }
}
