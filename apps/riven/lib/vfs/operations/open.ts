import Fuse from "@zkochan/fuse-native";
import { type Queue, UnrecoverableError } from "bullmq";
import chalk from "chalk";
import { StatusCodes } from "http-status-codes";
import { setTimeout } from "node:timers/promises";
import { request } from "undici";

import { services } from "../../database/database.ts";
import { enqueueProcessMediaItem } from "../../message-queue/flows/process-media-item/enqueue-process-media-item.ts";
import { enqueueRequestStreamLink } from "../../message-queue/flows/request-stream-link/enqueue-request-stream-link.ts";
import { runSingleJob } from "../../message-queue/utilities/run-single-job.ts";
import { logger } from "../../utilities/logger/logger.ts";
import { FuseError, isFuseError } from "../errors/fuse-error.ts";
import { attrCache } from "../utilities/attr-cache.ts";
import { calculateFileChunks } from "../utilities/chunks/calculate-file-chunks.ts";
import {
  fdToFileHandleMeta,
  fileNameIsFetchingLinkMap,
  fileNameToFdCountMap,
  fileNameToFileChunkCalculationsMap,
} from "../utilities/file-handle-map.ts";
import {
  getVfsOperationContext,
  withVfsOperationContext,
} from "../utilities/vfs-operation-context.ts";
import { withVfsScope } from "../utilities/with-vfs-scope.ts";

import type { PathInfo } from "../../database/services/vfs/schemas/path-info.schema.ts";
import type { ParamsFor } from "@repo/util-plugin-sdk";
import type { MediaEntry } from "@repo/util-plugin-sdk/dto/entities";
import type {
  MediaItemStreamLinkRequestedEvent,
  MediaItemStreamLinkRequestedResponse,
} from "@repo/util-plugin-sdk/schemas/events/media-item.stream-link-requested.event";

type LinkRequestQueues = Map<
  string,
  Queue<
    ParamsFor<MediaItemStreamLinkRequestedEvent>,
    MediaItemStreamLinkRequestedResponse
  >
>;

let fd = 0;

async function waitForStreamUrl() {
  const { path } = getVfsOperationContext("open");
  const timeoutController = AbortSignal.timeout(10_000);
  const pathInfo = services.vfsService.parsePath(path);

  while (!timeoutController.aborted) {
    const refreshed = await services.vfsService.getMediaEntry(pathInfo);

    if (refreshed?.streamUrl) {
      return refreshed.streamUrl;
    }

    await setTimeout(100);
  }

  throw new FuseError(Fuse.ETIMEDOUT, "Timed out waiting for stream URL");
}

async function fetchStreamLink(
  entry: MediaEntry,
  title: string,
  pathInfo: PathInfo,
) {
  try {
    fileNameIsFetchingLinkMap.set(entry.originalFilename, true);

    const { job } = await enqueueRequestStreamLink({
      mediaEntryId: entry.id,
      mediaItemTitle: title,
    });

    const { link } = await runSingleJob(job);

    attrCache.delete(pathInfo.rawPath);

    return link;
  } catch (error) {
    if (error instanceof UnrecoverableError) {
      logger.silly(
        `Deleting FUSE attr cache for ${pathInfo.rawPath} due to error whilst fetching stream link`,
      );

      attrCache.delete(pathInfo.rawPath);
    }

    throw new FuseError(
      Fuse.ENOENT,
      `Unable to get stream url: ${String(error)}`,
    );
  } finally {
    fileNameIsFetchingLinkMap.delete(entry.originalFilename);
  }
}

async function serveSubtitleFile(pathInfo: PathInfo) {
  const subtitleEntry = await services.vfsService.getSubtitleEntry(pathInfo);

  if (!subtitleEntry) {
    throw new FuseError(Fuse.ENOENT, "Subtitle not found");
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
  const entry = await services.vfsService.getMediaEntry(pathInfo, {
    populate: ["mediaItem.fullTitle"],
  });

  if (!entry) {
    throw new FuseError(Fuse.ENOENT, "No media entry found");
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
        "Media entry has no stream URL and no link request queue is available",
      );
    }

    entry.streamUrl = await fetchStreamLink(
      entry,
      entry.mediaItem.$.fullTitle,
      pathInfo,
    );
  }

  if (entry.streamUrl) {
    try {
      const response = await request(entry.streamUrl, {
        headers: {
          "accept-encoding": "identity",
          connection: "keep-alive",
          range: `bytes=0-0`,
        },
      });

      switch (response.statusCode) {
        case StatusCodes.NOT_FOUND.valueOf(): {
          logger.warn(
            `Received status code ${response.statusCode.toString()} when checking stream URL for media entry ${entry.id}`,
          );

          await services.streamService.clearStreamUrl(entry.id);

          entry.streamUrl = await fetchStreamLink(
            entry,
            entry.mediaItem.$.fullTitle,
            pathInfo,
          );

          break;
        }
        case StatusCodes.FORBIDDEN.valueOf():
        case StatusCodes.GONE.valueOf():
        case StatusCodes.UNAVAILABLE_FOR_LEGAL_REASONS.valueOf(): {
          logger.warn(
            `Received status code ${response.statusCode.toString()} when checking stream URL for media entry ${entry.id}`,
          );

          const { blacklistedItems, infoHash: blacklistedInfoHash } =
            await services.streamService.blacklistActiveStream({
              mediaItem: await entry.mediaItem.loadOrFail(),
              plugin: entry.plugin,
              provider: entry.provider,
            });

          logger.info(
            `Stream ${blacklistedInfoHash} for ${chalk.bold(entry.originalFilename)} has been blacklisted`,
          );

          const itemsToReprocess =
            await services.streamService.calculateItemsToReprocess(
              new Set(blacklistedItems),
            );

          for (const item of itemsToReprocess) {
            await enqueueProcessMediaItem({ id: item.id });
          }

          throw new FuseError(
            Fuse.ENOENT,
            `Dead torrent detected for ${entry.originalFilename} (${blacklistedInfoHash})`,
          );
        }
      }
    } catch (error) {
      if (isFuseError(error)) {
        throw error;
      }

      logger.error(
        `Error checking stream URL for media entry ${entry.id} at path ${pathInfo.rawPath}`,
        { err: error },
      );

      throw error;
    }
  }

  const streamUrl = entry.streamUrl ?? (await waitForStreamUrl());

  if (!streamUrl) {
    throw new FuseError(Fuse.ENOENT, "Media entry has no stream URL");
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
  void withVfsScope(() =>
    withVfsOperationContext(
      { operationName: "open", path, flags },
      async () => {
        const fd = await open(path, flags, linkRequestQueues);

        process.nextTick(callback, 0, fd);
      },
    ).catch((error: unknown) => {
      if (isFuseError(error)) {
        logger.error("VFS open FuseError", { err: error });

        process.nextTick(callback, error.errorCode);

        return;
      }

      logger.error(`VFS open error for path: ${path}`, { err: error });

      process.nextTick(callback, Fuse.EIO);
    }),
  );
};
