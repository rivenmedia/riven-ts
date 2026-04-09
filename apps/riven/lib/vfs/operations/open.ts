import Fuse from "@zkochan/fuse-native";
import { basename, extname } from "node:path";
import { setTimeout } from "node:timers/promises";

import { database } from "../../database/database.ts";
import { runSingleJob } from "../../message-queue/utilities/run-single-job.ts";
import { logger } from "../../utilities/logger/logger.ts";
import { serialiseEventData } from "../../utilities/serialisers/serialise-event-data.ts";
import { FuseError, isFuseError } from "../errors/fuse-error.ts";
import { PathInfo } from "../schemas/path-info.schema.ts";
import { attrCache } from "../utilities/attr-cache.ts";
import { calculateFileChunks } from "../utilities/chunks/calculate-file-chunks.ts";
import {
  fdToFileHandleMeta,
  fileNameIsFetchingLinkMap,
  fileNameToFdCountMap,
  fileNameToFileChunkCalculationsMap,
} from "../utilities/file-handle-map.ts";
import { withVfsScope } from "../utilities/with-vfs-scope.ts";

import type { ParamsFor } from "@repo/util-plugin-sdk";
import type {
  MediaItemStreamLinkRequestedEvent,
  MediaItemStreamLinkRequestedResponse,
} from "@repo/util-plugin-sdk/schemas/events/media-item.stream-link-requested.event";
import type { Queue } from "bullmq";

type LinkRequestQueues = Map<
  string,
  Queue<
    ParamsFor<MediaItemStreamLinkRequestedEvent>,
    MediaItemStreamLinkRequestedResponse
  >
>;

let fd = 0;

async function getSubtitleEntry(path: string) {
  const pathInfo = PathInfo.parse(path);
  const fileName = pathInfo.base;

  if (pathInfo.tmdbId) {
    return database.subtitleEntry.findOne({
      mediaItem: { tmdbId: pathInfo.tmdbId },
      path: { $like: `%${fileName}` },
    });
  }

  if (pathInfo.tvdbId && pathInfo.season && pathInfo.episode) {
    return database.subtitleEntry.findOne({
      mediaItem: {
        type: "episode",
        number: pathInfo.episode,
        season: { number: pathInfo.season },
        tvdbId: pathInfo.tvdbId,
      },
      path: { $like: `%${fileName}` },
    });
  }

  return null;
}

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
        tvdbId: pathInfo.tvdbId,
      },
    });
  }

  throw new FuseError(Fuse.ENOENT, `Invalid path for open: ${path}`);
}

async function serveSubtitleFile(path: string) {
  const subtitleEntry = await getSubtitleEntry(path);

  if (!subtitleEntry) {
    throw new FuseError(Fuse.ENOENT, `Subtitle not found for path: ${path}`);
  }

  const contentBuffer = Buffer.from(subtitleEntry.content, "utf8");
  const nextFd = fd++;

  fdToFileHandleMeta.set(nextFd, {
    type: "subtitle",
    fileSize: contentBuffer.length,
    filePath: path,
    fileBaseName: basename(path),
    contentBuffer,
  });

  logger.debug(
    `Opened subtitle file at path ${path} with fd ${nextFd.toString()}`,
  );

  return nextFd;
}

async function serveMediaFile(
  path: string,
  linkRequestQueues: LinkRequestQueues,
) {
  const entry = await getItemEntry(path);

  if (
    !entry.streamUrl &&
    fileNameIsFetchingLinkMap.get(entry.originalFilename)
  ) {
    logger.silly(
      `Waiting for stream URL for media entry ${entry.id.toString()}...`,
    );

    // Wait until the stream URL is fetched
    while (fileNameIsFetchingLinkMap.get(entry.originalFilename)) {
      await setTimeout(100);
    }

    const em = database.em.fork();

    // Refresh the item to get the updated stream URL
    await em.refreshOrFail(entry, {
      populate: ["*"],
      refresh: true,
    });

    if (!entry.streamUrl) {
      throw new FuseError(
        Fuse.ENOENT,
        `Media entry ${entry.id.toString()} has no stream URL after waiting`,
      );
    }
  }

  if (
    !entry.streamUrl &&
    !fileNameIsFetchingLinkMap.get(entry.originalFilename)
  ) {
    logger.silly(
      `No stream URL for media entry ${entry.id.toString()}, requesting from ${entry.plugin}...`,
    );

    const requestQueue = linkRequestQueues.get(entry.plugin);

    if (!requestQueue) {
      logger.error(
        `No link request queue found for ${entry.plugin} when opening file at path ${path}`,
      );

      throw new FuseError(
        Fuse.ENOENT,
        `Media entry ${entry.id.toString()} has no stream URL and no link request queue is available`,
      );
    }

    try {
      fileNameIsFetchingLinkMap.set(entry.originalFilename, true);

      const job = await requestQueue.add(
        entry.id.toString(),
        serialiseEventData("riven.media-item.stream-link.requested", {
          item: entry,
        }) as ParamsFor<MediaItemStreamLinkRequestedEvent>,
      );

      const { link: streamUrl } = await runSingleJob(job);

      const em = database.em.fork();

      em.assign(entry, { streamUrl });

      await em.persist(entry).flush();

      attrCache.delete(path);
    } catch (error: unknown) {
      throw new FuseError(
        Fuse.ENOENT,
        `Unable to get stream url for ${entry.originalFilename}: ${String(error)}`,
      );
    } finally {
      fileNameIsFetchingLinkMap.delete(entry.originalFilename);
    }
  }

  if (!entry.streamUrl) {
    throw new FuseError(
      Fuse.ENOENT,
      `Media entry ${entry.id.toString()} has no stream URL`,
    );
  }

  const nextFd = fd++;

  fileNameToFileChunkCalculationsMap.set(
    entry.originalFilename,
    calculateFileChunks(entry.originalFilename, entry.fileSize),
  );

  fdToFileHandleMeta.set(nextFd, {
    type: "media",
    fileSize: entry.fileSize,
    filePath: path,
    fileBaseName: basename(path),
    originalFileName: entry.originalFilename,
    url: entry.streamUrl,
  });

  fileNameToFdCountMap.set(
    entry.originalFilename,
    (fileNameToFdCountMap.get(entry.originalFilename) ?? 0) + 1,
  );

  logger.debug(`Opened file at path ${path} with fd ${nextFd.toString()}`);

  return nextFd;
}

async function open(
  path: string,
  _flags: number,
  linkRequestQueues: LinkRequestQueues,
) {
  // Handle subtitle files (.srt) — serve directly from DB content
  if (extname(path) === ".srt") {
    return serveSubtitleFile(path);
  }

  return serveMediaFile(path, linkRequestQueues);
}

export const openSync = function (
  path: string,
  flags: number,
  linkRequestQueues: LinkRequestQueues,
  callback: (err: number, fd?: number) => void,
) {
  void withVfsScope(async () => {
    try {
      const fd = await open(path, flags, linkRequestQueues);

      process.nextTick(callback, 0, fd);
    } catch (error) {
      if (isFuseError(error)) {
        logger.error("VFS open FuseError", { err: error });

        process.nextTick(callback, error.errorCode);

        return;
      }

      logger.error("VFS open error", { err: error });

      process.nextTick(callback, Fuse.EIO);
    }
  });
};
