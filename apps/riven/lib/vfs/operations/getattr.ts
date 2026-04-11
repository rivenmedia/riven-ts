import {
  CombinedGraphQLErrors,
  type TypedDocumentNode,
  gql,
} from "@apollo/client";
import Fuse, { type OPERATIONS } from "@zkochan/fuse-native";
import { isZodErrorLike } from "zod-validation-error";

import { client } from "../../graphql/apollo-client.ts";
import { logger } from "../../utilities/logger/logger.ts";
import { FuseError, FuseErrorCode, isFuseError } from "../errors/fuse-error.ts";
import { attrCache } from "../utilities/attr-cache.ts";
import { isHiddenPath } from "../utilities/is-hidden-path.ts";
import { isIgnoredPath } from "../utilities/is-ignored-path.ts";
import { withVfsScope } from "../utilities/with-vfs-scope.ts";

import type {
  GetVfsEntryStatQuery,
  GetVfsEntryStatQueryVariables,
} from "./getattr.typegen.ts";

export type StatMode = "dir" | "file" | "link" | number;

const GET_VFS_ENTRY_STAT_QUERY: TypedDocumentNode<
  GetVfsEntryStatQuery,
  GetVfsEntryStatQueryVariables
> = gql`
  query GetVfsEntryStat($path: String!) {
    vfsEntryStat(path: $path) {
      atime
      ctime
      gid
      mode
      mtime
      nlink
      size
      uid
    }
  }
`;

async function getAttr(path: string) {
  try {
    const { data } = await client.query({
      query: GET_VFS_ENTRY_STAT_QUERY,
      variables: { path },
      fetchPolicy: "network-only", // Always fetch fresh data; the server will handle its own caching
    });

    if (!data?.vfsEntryStat) {
      throw new FuseError(Fuse.ENOENT, "Entry not found");
    }

    const { __typename, ...vfsEntryStat } = data.vfsEntryStat;

    return {
      ...vfsEntryStat,
      // FUSE expects Date objects for atime, ctime, and mtime, but GraphQL returns ISO strings, so we need to convert them back to Date objects
      /* eslint-disable no-restricted-globals */
      atime: new Date(vfsEntryStat.atime),
      ctime: new Date(vfsEntryStat.ctime),
      mtime: new Date(vfsEntryStat.mtime),
      /* eslint-enable no-restricted-globals */
    };
  } catch (error) {
    if (CombinedGraphQLErrors.is(error)) {
      for (const graphQLError of error.errors) {
        if (typeof graphQLError.extensions?.["fuseErrorCode"] === "number") {
          const errorCode = FuseErrorCode.safeParse(
            graphQLError.extensions["fuseErrorCode"],
          );

          if (!errorCode.success) {
            throw new Error(
              `Invalid Fuse error code: ${graphQLError.extensions["fuseErrorCode"].toString()}`,
            );
          }

          throw new FuseError(errorCode.data, graphQLError.message);
        }
      }
    }

    throw error;
  }
}

export const getattrSync = function (path, callback) {
  void withVfsScope(async () => {
    try {
      const cachedAttr = attrCache.get(path);

      if (cachedAttr) {
        logger.silly(`VFS getattr: Cache hit for path ${path}`);

        process.nextTick(callback, null, cachedAttr);

        return;
      }

      if (isHiddenPath(path) || isIgnoredPath(path)) {
        logger.silly(`VFS getattr: Skipping hidden/ignored path ${path}`);

        process.nextTick(callback, Fuse.ENOENT);

        return;
      }

      const attrs = await getAttr(path);

      attrCache.set(path, attrs);

      logger.silly(`VFS getattr: Cache miss for path ${path}`);

      process.nextTick(callback, null, attrs);
    } catch (error) {
      if (isFuseError(error)) {
        logger.error("VFS getattr FuseError", { err: error });

        process.nextTick(callback, error.errorCode);

        return;
      }

      if (isZodErrorLike(error)) {
        logger.error("VFS getattr validation error", { err: error });

        process.nextTick(callback, Fuse.ENOENT);

        return;
      }

      logger.error("Unexpected VFS getattr error", { err: error });

      process.nextTick(callback, Fuse.EIO);
    }
  });
} satisfies OPERATIONS["getattr"];
