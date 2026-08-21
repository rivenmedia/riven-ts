import { BlacklistedStream } from "@repo/util-plugin-sdk/dto/entities";

import { gql } from "@apollo/client";
import { describe, expect } from "vitest";

import { it } from "../../__tests__/test-context.ts";
import { createQueue } from "../../message-queue/utilities/create-queue.ts";

import type {
  BlacklistActiveStreamMutation,
  BlacklistActiveStreamMutationVariables,
  GetMediaItemsQuery,
  GetMediaItemsQueryVariables,
} from "./media-item.resolver.spec.typegen.ts";
import type { TypedDocumentNode } from "@apollo/client";

describe("blacklistActiveStream", () => {
  const BLACKLIST_ACTIVE_STREAM: TypedDocumentNode<
    BlacklistActiveStreamMutation,
    BlacklistActiveStreamMutationVariables
  > = gql`
    mutation BlacklistActiveStream($mediaItemId: ID!) {
      blacklistActiveStream(mediaItemId: $mediaItemId)
    }
  `;

  it("returns true if the request succeeded", async ({
    gqlContext,
    gqlServer,
    completedMovieContext: { completedMovie },
  }) => {
    createQueue("process-media-item");

    const { body } = await gqlServer.executeOperation<
      BlacklistActiveStreamMutation,
      BlacklistActiveStreamMutationVariables
    >(
      {
        query: BLACKLIST_ACTIVE_STREAM,
        variables: {
          mediaItemId: completedMovie.id,
        },
      },
      { contextValue: gqlContext },
    );

    expect.assert(body.kind === "single");

    expect(body.singleResult.errors).toBeUndefined();
    expect(body.singleResult.data?.blacklistActiveStream).toBe(true);
  });

  it("blacklists the active stream for a media item", async ({
    em,
    gqlContext,
    gqlServer,
    completedMovieContext: { completedMovie },
  }) => {
    expect.assert(completedMovie.activeStream?.infoHash);

    await gqlServer.executeOperation<
      BlacklistActiveStreamMutation,
      BlacklistActiveStreamMutationVariables
    >(
      {
        query: BLACKLIST_ACTIVE_STREAM,
        variables: {
          mediaItemId: completedMovie.id,
        },
      },
      { contextValue: gqlContext },
    );

    await expect(
      em.findOneOrFail(BlacklistedStream, {
        stream: completedMovie.activeStream.infoHash,
      }),
    ).resolves.toBeInstanceOf(BlacklistedStream);
  });
});

describe("mediaItems", () => {
  const GET_MEDIA_ITEMS: TypedDocumentNode<
    GetMediaItemsQuery,
    GetMediaItemsQueryVariables
  > = gql`
    query GetMediaItems($itemsPerPage: Int, $after: String) {
      mediaItems(after: $after, itemsPerPage: $itemsPerPage) {
        items {
          ... on MediaItem {
            id
            fullTitle
          }
        }
      }
    }
  `;

  it("returns a paginated list of media items", async ({
    gqlContext,
    gqlServer,
    seeders: { seedIndexedMovie },
  }) => {
    await seedIndexedMovie(10);

    const { body } = await gqlServer.executeOperation<
      GetMediaItemsQuery,
      GetMediaItemsQueryVariables
    >(
      {
        query: GET_MEDIA_ITEMS,
        variables: {
          itemsPerPage: 10,
        },
      },
      { contextValue: gqlContext },
    );

    expect.assert(body.kind === "single");

    expect(body.singleResult.errors).toBeUndefined();
    expect(body.singleResult.data?.mediaItems.items).toHaveLength(10);
  });

  it("defaults to 25 items per page", async ({
    gqlContext,
    gqlServer,
    seeders: { seedIndexedMovie },
  }) => {
    await seedIndexedMovie(26);

    const { body } = await gqlServer.executeOperation<
      GetMediaItemsQuery,
      GetMediaItemsQueryVariables
    >(
      {
        query: GET_MEDIA_ITEMS,
      },
      { contextValue: gqlContext },
    );

    expect.assert(body.kind === "single");

    expect(body.singleResult.errors).toBeUndefined();
    expect(body.singleResult.data?.mediaItems.items).toHaveLength(25);
  });

  it("defaults to page 1", async ({
    gqlContext,
    gqlServer,
    factories: { movieFactory },
  }) => {
    const movieA = await movieFactory.createOne({ title: "A Movie" });

    // Create a second movie to ensure pagination works correctly
    await movieFactory.createOne({ title: "B Movie" });

    const { body } = await gqlServer.executeOperation<
      GetMediaItemsQuery,
      GetMediaItemsQueryVariables
    >(
      { query: GET_MEDIA_ITEMS, variables: { itemsPerPage: 1 } },
      { contextValue: gqlContext },
    );

    expect.assert(body.kind === "single");

    expect(body.singleResult.errors).toBeUndefined();
    expect(body.singleResult.data?.mediaItems.items[0]?.fullTitle).toBe(
      movieA.fullTitle,
    );
  });
});
