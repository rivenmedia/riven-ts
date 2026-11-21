import { MediaEntry } from "@repo/util-plugin-sdk/dto/entities";

import { gql } from "@apollo/client";
import { expect } from "vitest";

import { it as baseIt } from "#__tests__/test-context.ts";

import type {
  MediaEntryResolverSpecGetDownloadUrlQuery,
  MediaEntryResolverSpecGetDownloadUrlQueryVariables,
} from "./media-entry.resolver.spec.typegen.ts";
import type { TypedDocumentNode } from "@apollo/client";
import type { Permissions } from "@repo/util-auth/access-control";

const GET_DOWNLOAD_URL: TypedDocumentNode<
  MediaEntryResolverSpecGetDownloadUrlQuery,
  MediaEntryResolverSpecGetDownloadUrlQueryVariables
> = gql`
  query MediaEntryResolverSpecGetDownloadUrl($id: ID!) {
    mediaItemById(id: $id) {
      ... on Movie {
        mediaEntries {
          downloadUrl
        }
      }
    }
  }
`;

const downloadUrl = "https://debrid.example.com/download/movie.mkv";

const it = baseIt.extend(
  "movieWithDownloadUrl",
  async ({ completedMovieContext: { completedMovie }, em }) => {
    await em.nativeUpdate(
      MediaEntry,
      { mediaItem: completedMovie.id },
      { downloadUrl },
    );

    return completedMovie;
  },
);

const createManageSettings = (): Permissions => ({
  instance: ["manage-settings"],
});

it("resolves downloadUrl for a caller with the manage-settings permission", async ({
  gqlExecuteAs,
  movieWithDownloadUrl,
  userWith,
}) => {
  await expect(
    gqlExecuteAs(userWith(createManageSettings()), GET_DOWNLOAD_URL, {
      id: movieWithDownloadUrl.id,
    }),
  ).resolves.toStrictEqual({
    data: { mediaItemById: { mediaEntries: [{ downloadUrl }] } },
    errors: [],
  });
});

it("denies downloadUrl to a caller without the manage-settings permission", async ({
  gqlExecuteAs,
  movieWithDownloadUrl,
  userWithout,
}) => {
  await expect(
    gqlExecuteAs(userWithout(createManageSettings()), GET_DOWNLOAD_URL, {
      id: movieWithDownloadUrl.id,
    }),
  ).resolves.toStrictEqual({
    data: { mediaItemById: { mediaEntries: [{ downloadUrl: null }] } },
    errors: [
      {
        path: "mediaItemById.mediaEntries.0.downloadUrl",
        code: "UNAUTHORIZED",
      },
    ],
  });
});
