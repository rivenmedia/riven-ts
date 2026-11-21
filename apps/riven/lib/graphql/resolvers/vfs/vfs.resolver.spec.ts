import { gql } from "@apollo/client";
import fs from "node:fs";
import { expect } from "vitest";

import { it as baseIt } from "#__tests__/test-context.ts";

import type {
  VfsResolverSpecGetDirectoryQuery,
  VfsResolverSpecGetDirectoryQueryVariables,
  VfsResolverSpecGetEntryQuery,
  VfsResolverSpecGetEntryQueryVariables,
  VfsResolverSpecGetStatQuery,
  VfsResolverSpecGetStatQueryVariables,
} from "./vfs.resolver.spec.typegen.ts";
import type { TypedDocumentNode } from "@apollo/client";
import type { Permissions } from "@repo/util-auth/access-control";

const GET_STAT: TypedDocumentNode<
  VfsResolverSpecGetStatQuery,
  VfsResolverSpecGetStatQueryVariables
> = gql`
  query VfsResolverSpecGetStat($path: String!) {
    vfsEntryStat(path: $path) {
      mode
      nlink
      size
    }
  }
`;

const GET_DIRECTORY: TypedDocumentNode<
  VfsResolverSpecGetDirectoryQuery,
  VfsResolverSpecGetDirectoryQueryVariables
> = gql`
  query VfsResolverSpecGetDirectory($path: String!) {
    vfsDirectoryEntryPaths(path: $path)
  }
`;

const GET_ENTRY: TypedDocumentNode<
  VfsResolverSpecGetEntryQuery,
  VfsResolverSpecGetEntryQueryVariables
> = gql`
  query VfsResolverSpecGetEntry($path: String!) {
    vfsEntry(path: $path) {
      ... on MediaEntry {
        id
      }
    }
  }
`;

const createManageSettings = (): Permissions => ({
  instance: ["manage-settings"],
});

const it = baseIt.extend(
  "movieEntry",
  async ({ completedMovieContext: { completedMovie } }) => {
    const [mediaEntry] = await completedMovie.getMediaEntries();

    expect.assert(mediaEntry);

    return {
      id: mediaEntry.id,
      fileSize: mediaEntry.fileSize,
      path: `/${mediaEntry.baseDirectory}/${mediaEntry.path}`,
    };
  },
);

it("returns the stats of a VFS file", async ({
  gqlExecuteAs,
  movieEntry,
  userWith,
}) => {
  await expect(
    gqlExecuteAs(userWith(createManageSettings()), GET_STAT, {
      path: movieEntry.path,
    }),
  ).resolves.toStrictEqual({
    data: {
      vfsEntryStat: {
        // oxlint-disable-next-line no-bitwise
        mode: fs.constants.S_IFREG | 0o644,
        nlink: 1,
        size: movieEntry.fileSize,
      },
    },
    errors: [],
  });
});

it("lists the entries of a VFS directory", async ({
  gqlExecuteAs,
  userWith,
}) => {
  await expect(
    gqlExecuteAs(userWith(createManageSettings()), GET_DIRECTORY, {
      path: "/",
    }),
  ).resolves.toStrictEqual({
    data: { vfsDirectoryEntryPaths: ["movies", "shows"] },
    errors: [],
  });
});

it("returns the filesystem entry at a VFS path", async ({
  gqlExecuteAs,
  movieEntry,
  userWith,
}) => {
  await expect(
    gqlExecuteAs(userWith(createManageSettings()), GET_ENTRY, {
      path: movieEntry.path,
    }),
  ).resolves.toStrictEqual({
    data: { vfsEntry: { id: movieEntry.id } },
    errors: [],
  });
});

it("denies VFS queries to a caller without the manage-settings permission", async ({
  gqlExecuteAs,
  userWithout,
}) => {
  await expect(
    gqlExecuteAs(userWithout(createManageSettings()), GET_DIRECTORY, {
      path: "/",
    }),
  ).resolves.toMatchObject({
    data: null,
    errors: [{ path: "vfsDirectoryEntryPaths", code: "UNAUTHORIZED" }],
  });
});
