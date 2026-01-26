import { database } from "@repo/core-util-database/database";
import { logger } from "@repo/core-util-logger";

import Fuse from "@zkochan/fuse-native";

import { runSingleJob } from "../../message-queue/utilities/run-single-job.ts";
import { FuseError } from "../errors/fuse-error.ts";
import { PathInfo } from "../schemas/path-info.schema.ts";
import { calculateFileChunks } from "../utilities/chunks/calculate-file-chunks.ts";
import {
  fdToFileHandleMeta,
  fileNameToFileChunkCalculationsMap,
} from "../utilities/file-handle-map.ts";

import type { ParamsFor } from "@repo/util-plugin-sdk";
import type {
  MediaItemStreamLinkRequestedEvent,
  MediaItemStreamLinkRequestedResponse,
} from "@repo/util-plugin-sdk/schemas/events/media-item.stream-link-requested.event";
import type { Queue } from "bullmq";

let fd = 0;

async function open(
  path: string,
  _flags: number,
  linkRequestQueues: Map<
    string,
    Queue<
      ParamsFor<MediaItemStreamLinkRequestedEvent>,
      MediaItemStreamLinkRequestedResponse
    >
  >,
) {
  const { tmdbId } = PathInfo.parse(path);

  if (!tmdbId) {
    throw new FuseError(Fuse.ENOENT, `Invalid path for open: ${path}`);
  }

  const item = await database.mediaEntry.findOneOrFail({
    mediaItem: {
      tmdbId,
    },
  });

  if (!item.unrestrictedUrl) {
    const requestQueue = linkRequestQueues.get(item.provider);

    if (!requestQueue) {
      logger.error(
        `No link request queue found for RealDebrid when opening file at path ${path}`,
      );

      throw new FuseError(
        Fuse.ENOENT,
        `Media entry ${item.id.toString()} has no unrestricted URL and no link request queue is available`,
      );
    }

    const mediaItem = await item.mediaItem.loadOrFail();

    try {
      const { url: unrestrictedUrl } = await runSingleJob(
        requestQueue,
        item.id.toString(),
        { item: mediaItem },
      );

      const em = database.em.fork();

      em.assign(item, { unrestrictedUrl });
      em.persist(item);

      await em.flush();
      await em.refreshOrFail(item, {
        populate: ["mediaItem"],
      });
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw new FuseError(
          Fuse.ENOENT,
          `Unable to get unrestricted url for ${mediaItem.title ?? "Unknown"}: ${error.message}`,
        );
      }
    }
  }

  if (!item.unrestrictedUrl) {
    throw new FuseError(
      Fuse.ENOENT,
      `Media entry ${item.id.toString()} has no unrestricted URL`,
    );
  }

  const nextFd = fd++;

  fileNameToFileChunkCalculationsMap.set(
    item.originalFilename,
    calculateFileChunks(item.id, Number(item.fileSize)),
  );

  fdToFileHandleMeta.set(nextFd, {
    fileId: item.id,
    fileSize: item.fileSize.toString(),
    filePath: path,
    fileName: item.originalFilename,
    url: item.unrestrictedUrl,
  });

  logger.debug(`Opened file at path ${path} with fd ${nextFd.toString()}`);

  return nextFd;
}

export const openSync = function (
  path: string,
  flags: number,
  linkRequestQueues: Map<
    string,
    Queue<
      ParamsFor<MediaItemStreamLinkRequestedEvent>,
      MediaItemStreamLinkRequestedResponse
    >
  >,
  callback: (err: number, fd?: number) => void,
) {
  open(path, flags, linkRequestQueues)
    .then(callback.bind(null, 0))
    .catch((error: unknown) => {
      logger.error(`VFS open error: ${(error as Error).message}`);

      callback(Fuse.EIO);
    });
};
