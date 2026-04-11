import { type TypedDocumentNode, gql } from "@apollo/client";
import Fuse from "@zkochan/fuse-native";
import { basename } from "node:path";
import { firstValueFrom } from "rxjs";

import { client } from "../../graphql/apollo-client.ts";
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

import type {
  GetVfsEntryQuery,
  GetVfsEntryQueryVariables,
  MediaEntryStreamUrlFragment,
  SaveStreamUrlMutation,
  SaveStreamUrlMutationVariables,
} from "./open.typegen.ts";
import type { ParamsFor } from "@repo/util-plugin-sdk";
import type {
  MediaItemStreamLinkRequestedEvent,
  MediaItemStreamLinkRequestedResponse,
} from "@repo/util-plugin-sdk/schemas/events/media-item.stream-link-requested.event";
import type { Queue } from "bullmq";

let fd = 0;

const SAVE_STREAM_URL_MUTATION: TypedDocumentNode<
  SaveStreamUrlMutation,
  SaveStreamUrlMutationVariables
> = gql`
  mutation SaveStreamUrl($id: ID!, $url: String!) {
    saveStreamUrl(id: $id, url: $url) {
      id
      streamUrl
    }
  }
`;

const STREAM_URL_FRAGMENT: TypedDocumentNode<
  MediaEntryStreamUrlFragment,
  never
> = gql`
  fragment MediaEntryStreamUrl on MediaEntry {
    streamUrl
  }
`;

const GET_VFS_ENTRY_QUERY: TypedDocumentNode<
  GetVfsEntryQuery,
  GetVfsEntryQueryVariables
> = gql`
  query GetVfsEntry($path: String!) {
    vfsEntry(path: $path) {
      id
      originalFilename
      fileSize
      streamUrl
      plugin
    }
  }
`;

async function getItemEntry(path: string) {
  const { data } = await client.query({
    query: GET_VFS_ENTRY_QUERY,
    variables: { path },
  });

  if (!data?.vfsEntry) {
    throw new FuseError(Fuse.ENOENT, "Entry not found");
  }

  return data.vfsEntry;
}

async function waitForStreamUrl(entry: MediaEntryStreamUrlFragment) {
  const streamUrlObservable = client.watchFragment({
    from: entry,
    fragment: STREAM_URL_FRAGMENT,
  });

  const {
    data: { streamUrl },
  } = await firstValueFrom(streamUrlObservable);

  return streamUrl;
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
    !entry.streamUrl &&
    !fileNameIsFetchingLinkMap.get(entry.originalFilename)
  ) {
    logger.silly(
      `No stream URL for media entry ${entry.id}, requesting from ${entry.plugin}...`,
    );

    const requestQueue = linkRequestQueues.get(entry.plugin);

    if (!requestQueue) {
      logger.error(
        `No link request queue found for ${entry.plugin} when opening file at path ${path}`,
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
          item: entry as never, // TODO: Fix type. serialiseEventData should be aware of the event serialiser map's types
        }) as ParamsFor<MediaItemStreamLinkRequestedEvent>,
      );

      const { link: streamUrl } = await runSingleJob(job);

      await client.mutate({
        mutation: SAVE_STREAM_URL_MUTATION,
        variables: {
          id: entry.id,
          url: streamUrl,
        },
      });

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

  const streamUrl = entry.streamUrl ?? (await waitForStreamUrl(entry));

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
    fileSize: entry.fileSize,
    filePath: path,
    fileBaseName: basename(path),
    originalFileName: entry.originalFilename,
    url: streamUrl,
  });

  fileNameToFdCountMap.set(
    entry.originalFilename,
    (fileNameToFdCountMap.get(entry.originalFilename) ?? 0) + 1,
  );

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
