import Fuse from "@zkochan/fuse-native";
import { setTimeout } from "node:timers/promises";

import { services } from "../../database/database.ts";
import { runSingleJob } from "../../message-queue/utilities/run-single-job.ts";
import { logger } from "../../utilities/logger/logger.ts";
import { serialiseEventData } from "../../utilities/serialisers/serialise-event-data.ts";
import { FuseError, isFuseError } from "../errors/fuse-error.ts";
import { attrCache } from "../utilities/attr-cache.ts";
import { calculateFileChunks } from "../utilities/chunks/calculate-file-chunks.ts";
import {
  fdToFileHandleMeta,
  fileNameIsFetchingLinkMap,
  fileNameToFdCountMap,
  fileNameToFileChunkCalculationsMap,
} from "../utilities/file-handle-map.ts";
import { withVfsScope } from "../utilities/with-vfs-scope.ts";

import type { PathInfo } from "../../database/services/vfs/schemas/path-info.schema.ts";
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

async function waitForStreamUrl(path: string) {
  const timeoutController = AbortSignal.timeout(10_000);
  const pathInfo = services.vfsService.parsePath(path);

  while (!timeoutController.aborted) {
    const refreshed = await services.vfsService.getMediaEntry(pathInfo);

    if (refreshed?.streamUrl) {
      return refreshed.streamUrl;
    }

    await setTimeout(100);
  }

  throw new FuseError(
    Fuse.ETIMEDOUT,
    `Timed out waiting for stream URL for path ${path}`,
  );
}

async function serveSubtitleFile(pathInfo: PathInfo) {
  const subtitleEntry = await services.vfsService.getSubtitleEntry(pathInfo);

  if (!subtitleEntry) {
    throw new FuseError(
      Fuse.ENOENT,
      `Subtitle not found for path: ${pathInfo.rawPath}`,
    );
  }

  const contentBuffer = Buffer.from(subtitleEntry.content, "utf8");
  const nextFd = fd++;

  fdToFileHandleMeta.set(nextFd, {
    type: "subtitle",
    fileSize: contentBuffer.length,
    filePath: pathInfo.rawPath,
    fileBaseName: pathInfo.base,
    contentBuffer,
  });

  logger.debug(
    `Opened subtitle file at path ${pathInfo.rawPath} with fd ${nextFd.toString()}`,
  );

  return nextFd;
}

async function serveMediaFile(
  pathInfo: PathInfo,
  linkRequestQueues: LinkRequestQueues,
) {
  const entry = await services.vfsService.getMediaEntry(pathInfo);

  if (!entry) {
    throw new FuseError(
      Fuse.ENOENT,
      `No media entry found for path ${pathInfo.rawPath}`,
    );
  }

  if (
    !entry.streamUrl &&
    !fileNameIsFetchingLinkMap.get(entry.originalFilename)
  ) {
    logger.silly(
      `No stream URL for media entry ${entry.id}, requesting from ${entry.plugin}...`,
    );

    const requestQueue = linkRequestQueues.get(entry.plugin);

    if (!requestQueue) {
      logger.error(
        `No link request queue found for ${entry.plugin} when opening file at path ${pathInfo.rawPath}`,
      );

      throw new FuseError(
        Fuse.ENOENT,
        `Media entry ${entry.id} has no stream URL and no link request queue is available`,
      );
    }

    try {
      fileNameIsFetchingLinkMap.set(entry.originalFilename, true);

      const job = await requestQueue.add(
        entry.id,
        serialiseEventData("riven.media-item.stream-link.requested", {
          item: entry,
        }) as ParamsFor<MediaItemStreamLinkRequestedEvent>,
      );

      const { link: streamUrl } = await runSingleJob(job);

      await services.vfsService.saveStreamUrl(entry.id, streamUrl);

      attrCache.delete(pathInfo.rawPath);
    } catch (error: unknown) {
      throw new FuseError(
        Fuse.ENOENT,
        `Unable to get stream url for ${entry.originalFilename}: ${String(error)}`,
      );
    } finally {
      fileNameIsFetchingLinkMap.delete(entry.originalFilename);
    }
  }

  const streamUrl =
    entry.streamUrl ?? (await waitForStreamUrl(pathInfo.rawPath));

  if (!streamUrl) {
    throw new FuseError(
      Fuse.ENOENT,
      `Media entry ${entry.id} has no stream URL`,
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
    filePath: pathInfo.rawPath,
    fileBaseName: pathInfo.base,
    originalFileName: entry.originalFilename,
    url: streamUrl,
  });

  fileNameToFdCountMap.set(
    entry.originalFilename,
    (fileNameToFdCountMap.get(entry.originalFilename) ?? 0) + 1,
  );

  logger.debug(
    `Opened file at path ${pathInfo.rawPath} with fd ${nextFd.toString()}`,
  );

  return nextFd;
}

async function open(
  path: string,
  _flags: number,
  linkRequestQueues: LinkRequestQueues,
) {
  const pathInfo = services.vfsService.parsePath(path);

  if (pathInfo.pathType === "subtitle-file") {
    return serveSubtitleFile(pathInfo);
  }

  return serveMediaFile(pathInfo, linkRequestQueues);
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
