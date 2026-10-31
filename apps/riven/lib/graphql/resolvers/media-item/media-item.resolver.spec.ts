import { BlacklistedStream } from "@repo/util-plugin-sdk/dto/entities";

import { gql } from "@apollo/client";
import { Worker } from "bullmq";
import { describe, expect } from "vitest";

import { it } from "#__tests__/test-context.ts";
import { createQueue } from "#message-queue/utilities/create-queue.ts";
import { settings } from "#utilities/settings.ts";

import type {
  BlacklistActiveStreamResolverSpecMutation,
  BlacklistActiveStreamResolverSpecMutationVariables,
  GetMediaItemsQuery,
  GetMediaItemsQueryVariables,
  MediaItemIsProcessingSubscription,
  MediaItemIsProcessingSubscriptionVariables,
  MediaItemStateChangedSubscription,
  MediaItemStateChangedSubscriptionVariables,
} from "./media-item.resolver.spec.typegen.ts";
import type { TypedDocumentNode } from "@apollo/client";

describe("blacklistActiveStream", () => {
  const BLACKLIST_ACTIVE_STREAM: TypedDocumentNode<
    BlacklistActiveStreamResolverSpecMutation,
    BlacklistActiveStreamResolverSpecMutationVariables
  > = gql`
    mutation BlacklistActiveStreamResolverSpec($mediaItemId: ID!) {
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
      BlacklistActiveStreamResolverSpecMutation,
      BlacklistActiveStreamResolverSpecMutationVariables
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
      BlacklistActiveStreamResolverSpecMutation,
      BlacklistActiveStreamResolverSpecMutationVariables
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

describe("mediaItemStateChanged", () => {
  const MEDIA_ITEM_STATE_CHANGED: TypedDocumentNode<
    MediaItemStateChangedSubscription,
    MediaItemStateChangedSubscriptionVariables
  > = gql`
    subscription MediaItemStateChanged($id: ID!) {
      mediaItemStateChanged(id: $id) {
        ... on Movie {
          id
          state
        }
      }
    }
  `;

  it("emits the media item when its state changes", async ({
    em,
    gqlSubscribe,
    indexedMovieContext: { indexedMovie },
    factories: { streamFactory },
  }) => {
    const { nextEvent } = await gqlSubscribe(MEDIA_ITEM_STATE_CHANGED, {
      id: indexedMovie.id,
    });

    indexedMovie.streams.add(await streamFactory.createOne());

    await em.persist(indexedMovie).flush();

    const { data, errors } = await nextEvent;

    expect(errors).toBeUndefined();
    expect(data).toStrictEqual({
      mediaItemStateChanged: {
        id: indexedMovie.id,
        state: "scraped",
      },
    });
  });
});

describe("mediaItemIsProcessing", () => {
  const MEDIA_ITEM_IS_PROCESSING: TypedDocumentNode<
    MediaItemIsProcessingSubscription,
    MediaItemIsProcessingSubscriptionVariables
  > = gql`
    subscription MediaItemIsProcessing($id: ID!) {
      mediaItemIsProcessing(id: $id)
    }
  `;

  it("emits false if the media item is not being processed", async ({
    gqlSubscribe,
    indexedMovieContext: { indexedMovie },
  }) => {
    createQueue("process-media-item");

    const { nextEvent } = await gqlSubscribe(MEDIA_ITEM_IS_PROCESSING, {
      id: indexedMovie.id,
    });

    const { data, errors } = await nextEvent;

    expect(errors).toBeUndefined();
    expect(data).toStrictEqual({ mediaItemIsProcessing: false });
  });

  it("emits true if the media item is being processed", async ({
    gqlSubscribe,
    indexedMovieContext: { indexedMovie },
    onTestFinished,
  }) => {
    await createQueue("process-media-item").add(
      "Process media item",
      {},
      {
        deduplication: {
          id: `process-${indexedMovie.type}-${indexedMovie.id}`,
        },
      },
    );

    const worker = new Worker("process-media-item", null, {
      autorun: false,
      connection: { url: settings.redisUrl },
    });

    onTestFinished(async () => worker.close());

    await worker.getNextJob("test-token");

    const { nextEvent } = await gqlSubscribe(MEDIA_ITEM_IS_PROCESSING, {
      id: indexedMovie.id,
    });

    const { data, errors } = await nextEvent;

    expect(errors).toBeUndefined();
    expect(data).toStrictEqual({ mediaItemIsProcessing: true });
  });
});
