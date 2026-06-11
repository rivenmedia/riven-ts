import Fuse from "@zkochan/fuse-native";
import chalk from "chalk";
import assert from "node:assert";

import { services } from "../../database/database.ts";
import { enqueueRequestStreamLink } from "../../message-queue/flows/request-stream-link/enqueue-request-stream-link.ts";
import { runSingleJob } from "../../message-queue/utilities/run-single-job.ts";
import { logger } from "../../utilities/logger/logger.ts";
import { FuseError, isFuseError } from "../errors/fuse-error.ts";
import { calculateFileChunks } from "../utilities/chunks/calculate-file-chunks.ts";
import {
  fdToFileHandleMeta,
  fileNameToFdCountMap,
  fileNameToFileChunkCalculationsMap,
} from "../utilities/file-handle-map.ts";
import { withVfsOperationContext } from "../utilities/vfs-operation-context.ts";
import { withVfsScope } from "../utilities/with-vfs-scope.ts";

import type { PathInfo } from "../../database/services/vfs/schemas/path-info.schema.ts";
import type { Loaded } from "@mikro-orm/core";
import type { MediaEntry } from "@repo/util-plugin-sdk/dto/entities";

let fd = 0;

async function getStreamLinkFromCacheOrQueue(
  mediaEntry: Loaded<MediaEntry, "mediaItem.fullTitle">,
) {
  const cachedStreamLink = await services.streamService.getStreamLink(
    mediaEntry.id,
  );

  if (cachedStreamLink) {
    logger.debug(
      `Returning cached stream link for ${chalk.bold(mediaEntry.mediaItem.$.fullTitle)}`,
    );

    return cachedStreamLink;
  }

  const { job } = await enqueueRequestStreamLink({
    mediaEntryId: mediaEntry.id,
    mediaItemTitle: mediaEntry.mediaItem.$.fullTitle,
  });

  return await runSingleJob(job, 10_000);
}

async function serveSubtitleFile(pathInfo: PathInfo) {
  const subtitleEntry = await services.vfsService.getSubtitleEntry(pathInfo);

  assert(subtitleEntry, new FuseError(Fuse.ENOENT, "Subtitle not found"));

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

async function serveMediaFile(pathInfo: PathInfo) {
  const entry = await services.vfsService.getMediaEntry(pathInfo, {
    populate: ["mediaItem.fullTitle"],
  });

  assert(entry, new FuseError(Fuse.ENOENT, "No media entry found"));

  const streamLink = await getStreamLinkFromCacheOrQueue(entry);

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
    url: streamLink,
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

async function open(path: string, _flags: number) {
  const pathInfo = services.vfsService.parsePath(path);

  if (pathInfo.pathType === "subtitle-file") {
    return serveSubtitleFile(pathInfo);
  }

  return serveMediaFile(pathInfo);
}

export const openSync = function (
  path: string,
  flags: number,
  callback: (err: number, fd?: number) => void,
) {
  void withVfsScope(() =>
    withVfsOperationContext(
      { operationName: "open", path, flags },
      async () => {
        const fd = await open(path, flags);

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
