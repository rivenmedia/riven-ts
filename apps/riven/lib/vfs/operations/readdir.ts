import { type TypedDocumentNode, gql } from "@apollo/client";
import Fuse, { type OPERATIONS } from "@zkochan/fuse-native";

import { client } from "../../graphql/apollo-client.ts";
import { logger } from "../../utilities/logger/logger.ts";
import { FuseError, isFuseError } from "../errors/fuse-error.ts";
import { withVfsScope } from "../utilities/with-vfs-scope.ts";

import type {
  GetVfsDirectoryEntryPathsQuery,
  GetVfsDirectoryEntryPathsQueryVariables,
} from "./readdir.typegen.ts";

const VFS_DIRECTORY_ENTRY_PATHS_QUERY: TypedDocumentNode<
  GetVfsDirectoryEntryPathsQuery,
  GetVfsDirectoryEntryPathsQueryVariables
> = gql`
  query GetVfsDirectoryEntryPaths($path: String!) {
    vfsDirectoryEntryPaths(path: $path)
  }
`;

async function readdir(path: string): Promise<string[]> {
  const { data } = await client.query({
    query: VFS_DIRECTORY_ENTRY_PATHS_QUERY,
    variables: { path },
  });

  if (!data?.vfsDirectoryEntryPaths) {
    throw new FuseError(Fuse.ENOENT, "Directory not found");
  }

  return data.vfsDirectoryEntryPaths;
}

export const readDirSync = function (path, callback) {
  void withVfsScope(async () => {
    try {
      const data = await readdir(path);

      process.nextTick(callback, 0, data);
    } catch (error) {
      if (isFuseError(error)) {
        logger.error("VFS readdir FuseError", { err: error });

        process.nextTick(callback, error.errorCode);

        return;
      }

      logger.error("Unexpected VFS readdir error", { err: error });

      process.nextTick(callback, Fuse.EIO);
    }
  });
} satisfies OPERATIONS["readdir"];
