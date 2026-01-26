import { database } from "@repo/core-util-database/database";
import { MediaEntry } from "@repo/util-plugin-sdk/dto/entities/index";

import { ref } from "@mikro-orm/core";
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
  const existingItem = await database.mediaItem.findOne(
    {
      streams: { infoHash: container.infoHash },
      id,
    },
    {
      populate: ["streams:ref", "filesystemEntries:ref"],
      populateWhere: "infer",
    },
  );

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

  const em = database.em.fork();

  existingItem.activeStream = ref(existingItem.streams[0]);
  existingItem.state = "Downloaded";

  const mediaEntry = new MediaEntry();

  mediaEntry.fileSize = container.files[0]?.fileSize ?? 0;
  mediaEntry.originalFilename = container.files[0]?.fileName ?? "";
  mediaEntry.mediaItem = ref(existingItem);

  existingItem.filesystemEntries.add(mediaEntry);

  try {
    await Promise.all([
      validateOrReject(existingItem),
      validateOrReject(mediaEntry),
    ]);

    em.persist(mediaEntry);
    em.persist(existingItem);

    await em.flush();

    return await em.refreshOrFail(existingItem);
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
