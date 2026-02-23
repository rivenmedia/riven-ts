import Fuse from "@zkochan/fuse-native";
import { basename } from "node:path";
import { setTimeout } from "node:timers/promises";

import { database } from "../../database/database.ts";
import { runSingleJob } from "../../message-queue/utilities/run-single-job.ts";
import { logger } from "../../utilities/logger/logger.ts";
import { FuseError } from "../errors/fuse-error.ts";
import { PathInfo } from "../schemas/path-info.schema.ts";
import { attrCache } from "../utilities/attr-cache.ts";
import { calculateFileChunks } from "../utilities/chunks/calculate-file-chunks.ts";
import {
  fdToFileHandleMeta,
  fileNameIsFetchingLinkMap,
  fileNameToFileChunkCalculationsMap,
} from "../utilities/file-handle-map.ts";

import type { ParamsFor } from "@repo/util-plugin-sdk";
import type {
  MediaItemStreamLinkRequestedEvent,
  MediaItemStreamLinkRequestedResponse,
} from "@repo/util-plugin-sdk/schemas/events/media-item.stream-link-requested.event";
import type { Queue } from "bullmq";

let fd = 0;

async function getItemEntry(path: string) {
  const pathInfo = PathInfo.parse(path);

  if (pathInfo.tmdbId) {
    return database.mediaEntry.findOneOrFail({
      mediaItem: {
        tmdbId: pathInfo.tmdbId,
      },
    });
  }

  if (pathInfo.tvdbId && pathInfo.season && pathInfo.episode) {
    return database.mediaEntry.findOneOrFail({
      mediaItem: {
        type: "episode",
        number: pathInfo.episode,
        season: {
          number: pathInfo.season,
        },
      },
    });
  }

  throw new FuseError(Fuse.ENOENT, `Invalid path for open: ${path}`);
}

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
  const entry = await getItemEntry(path);

  if (
    !entry.unrestrictedUrl &&
    fileNameIsFetchingLinkMap.get(entry.originalFilename)
  ) {
    logger.silly(
      `Waiting for unrestricted URL for media entry ${entry.id.toString()}...`,
    );

    // Wait until the unrestricted URL is fetched
    while (fileNameIsFetchingLinkMap.get(entry.originalFilename)) {
      await setTimeout(100);
    }

    const em = database.em.fork();

    // Refresh the item to get the updated unrestricted URL
    await em.refreshOrFail(entry, {
      populate: ["*"],
      refresh: true,
    });

    if (!entry.unrestrictedUrl) {
      throw new FuseError(
        Fuse.ENOENT,
        `Media entry ${entry.id.toString()} has no unrestricted URL after waiting`,
      );
    }
  }

  if (
    !entry.unrestrictedUrl &&
    !fileNameIsFetchingLinkMap.get(entry.originalFilename)
  ) {
    logger.silly(
      `No unrestricted URL for media entry ${entry.id.toString()}, requesting from ${entry.provider}...`,
    );

    const requestQueue = linkRequestQueues.get(entry.provider);

    if (!requestQueue) {
      logger.error(
        `No link request queue found for ${entry.provider} when opening file at path ${path}`,
      );

      throw new FuseError(
        Fuse.ENOENT,
        `Media entry ${entry.id.toString()} has no unrestricted URL and no link request queue is available`,
      );
    }

    try {
      fileNameIsFetchingLinkMap.set(entry.originalFilename, true);

      const job = await requestQueue.add(entry.id.toString(), { item: entry });

      const { url: unrestrictedUrl } = await runSingleJob(job);

      const em = database.em.fork();

      em.assign(entry, { unrestrictedUrl });

      await em.flush();

      attrCache.delete(path);
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw new FuseError(
          Fuse.ENOENT,
          `Unable to get unrestricted url for ${entry.originalFilename}: ${error.message}`,
        );
      }
    } finally {
      fileNameIsFetchingLinkMap.delete(entry.originalFilename);
    }
  }

  if (!entry.unrestrictedUrl) {
    throw new FuseError(
      Fuse.ENOENT,
      `Media entry ${entry.id.toString()} has no unrestricted URL`,
    );
  }

  const nextFd = fd++;

  fileNameToFileChunkCalculationsMap.set(
    entry.originalFilename,
    calculateFileChunks(entry.originalFilename, entry.fileSize),
  );

  fdToFileHandleMeta.set(nextFd, {
    fileSize: entry.fileSize,
    filePath: path,
    fileBaseName: basename(path),
    originalFileName: entry.originalFilename,
    url: entry.unrestrictedUrl,
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
    .then((fd) => {
      process.nextTick(callback, 0, fd);
    })
    .catch((error: unknown) => {
      logger.error(`VFS open error: ${(error as Error).message}`);

      process.nextTick(callback, Fuse.EIO);
    });
};
