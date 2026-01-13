import { database } from "@repo/core-util-database/connection";
import { MediaItem } from "@repo/util-plugin-sdk/dto/entities/index";

import { ValidationError, validateOrReject } from "class-validator";
import z from "zod";

import type { MainRunnerMachineIntake } from "../index.ts";
import type { TorrentContainer } from "@repo/util-plugin-sdk/schemas/torrents/torrent-container";

export interface PersistDownloadResultsInput {
  id: number;
  container: TorrentContainer;
  sendEvent: MainRunnerMachineIntake;
}

export async function persistDownloadResults({
  id,
  container,
  sendEvent,
}: PersistDownloadResultsInput) {
  const existingItem = await database.manager.findOne(MediaItem, {
    where: {
      streams: [{ infoHash: container.infoHash }],
      id,
    },
    relations: {
      streams: true,
    },
  });

  if (!existingItem) {
    throw new Error(`Media item with ID ${id.toString()} not found`);
  }

  if (!existingItem.streams[0]) {
    throw new Error(`Media item with ID ${id.toString()} has no streams`);
  }

  if (existingItem.state !== "Scraped") {
    sendEvent({
      type: "riven.media-item.download.error.incorrect-state",
      item: existingItem,
    });

    return;
  }

  existingItem.activeStream = existingItem.streams[0];
  existingItem.state = "Downloaded";

  try {
    await validateOrReject(existingItem);

    return await database.manager.save(MediaItem, existingItem);
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
