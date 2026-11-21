import { MediaEntry, Movie } from "@repo/util-plugin-sdk/dto/entities";

import { gql } from "@apollo/client";
import { Duration } from "luxon";
import { expect } from "vitest";

import { it } from "#__tests__/test-context.ts";
import { createQueue } from "#message-queue/utilities/create-queue.ts";

import type {
  MediaItemResolverSpecGetProcessingQuery,
  MediaItemResolverSpecGetProcessingQueryVariables,
  MediaItemResolverSpecResetMutation,
  MediaItemResolverSpecResetMutationVariables,
} from "./processing.spec.typegen.ts";
import type { TypedDocumentNode } from "@apollo/client";

const GET_PROCESSING: TypedDocumentNode<
  MediaItemResolverSpecGetProcessingQuery,
  MediaItemResolverSpecGetProcessingQueryVariables
> = gql`
  query MediaItemResolverSpecGetProcessing($id: ID!) {
    mediaItemById(id: $id) {
      ... on MediaItem {
        processorJobId
        nextScrapeAttemptAt
      }
    }
  }
`;

const RESET_MEDIA_ITEM: TypedDocumentNode<
  MediaItemResolverSpecResetMutation,
  MediaItemResolverSpecResetMutationVariables
> = gql`
  mutation MediaItemResolverSpecReset($mediaItemId: ID!) {
    resetMediaItem(mediaItemId: $mediaItemId) {
      ... on MediaItem {
        id
      }
    }
  }
`;

it("resetMediaItem removes the item's streams and files and enqueues it for processing", async ({
  em,
  gqlContext,
  gqlServer,
  completedMovieContext: { completedMovie },
}) => {
  createQueue("process-media-item");

  const { body } = await gqlServer.executeOperation<
    MediaItemResolverSpecResetMutation,
    MediaItemResolverSpecResetMutationVariables
  >(
    {
      query: RESET_MEDIA_ITEM,
      variables: { mediaItemId: completedMovie.id },
    },
    { contextValue: gqlContext },
  );

  expect.assert(body.kind === "single");
  expect(body.singleResult.errors).toBeUndefined();
  expect(body.singleResult.data?.resetMediaItem).toStrictEqual([
    expect.objectContaining({ id: completedMovie.id }),
  ]);

  const fork = em.fork();
  const movie = await fork.findOneOrFail(Movie, completedMovie.id, {
    populate: ["streams"],
  });

  expect(movie.activeStream).toBeNull();
  expect(movie.streams).toHaveLength(0);
  await expect(
    fork.count(MediaEntry, { mediaItem: completedMovie.id }),
  ).resolves.toBe(0);

  const { body: processingBody } = await gqlServer.executeOperation<
    MediaItemResolverSpecGetProcessingQuery,
    MediaItemResolverSpecGetProcessingQueryVariables
  >(
    { query: GET_PROCESSING, variables: { id: completedMovie.id } },
    { contextValue: gqlContext },
  );

  expect.assert(processingBody.kind === "single");
  expect(processingBody.singleResult.errors).toBeUndefined();
  expect(processingBody.singleResult.data?.mediaItemById).toMatchObject({
    processorJobId: expect.any(String),
  });
});

it("processing fields are empty when the item is not being processed", async ({
  gqlContext,
  gqlServer,
  indexedMovieContext: { indexedMovie },
}) => {
  createQueue("process-media-item");

  const { body } = await gqlServer.executeOperation<
    MediaItemResolverSpecGetProcessingQuery,
    MediaItemResolverSpecGetProcessingQueryVariables
  >(
    { query: GET_PROCESSING, variables: { id: indexedMovie.id } },
    { contextValue: gqlContext },
  );

  expect.assert(body.kind === "single");
  expect(body.singleResult.errors).toBeUndefined();
  expect({ ...body.singleResult.data?.mediaItemById }).toStrictEqual({
    processorJobId: null,
    nextScrapeAttemptAt: null,
  });
});

it("processing fields resolve the processor job and when its scrape job is next attempted", async ({
  gqlContext,
  gqlServer,
  indexedMovieContext: { indexedMovie },
}) => {
  createQueue("process-media-item");
  createQueue("scrape-item");

  const { flow } = await import("#message-queue/flows/producer.ts");
  const delay = Duration.fromObject({ hours: 2 }).toMillis();

  const { job, children } = await flow.add({
    name: "process",
    queueName: "process-media-item",
    opts: {
      deduplication: { id: `process-movie-${indexedMovie.id}` },
    },
    children: [{ name: "scrape", queueName: "scrape-item", opts: { delay } }],
  });

  const [scrapeJob] = children ?? [];

  expect.assert(scrapeJob);

  const { body } = await gqlServer.executeOperation<
    MediaItemResolverSpecGetProcessingQuery,
    MediaItemResolverSpecGetProcessingQueryVariables
  >(
    { query: GET_PROCESSING, variables: { id: indexedMovie.id } },
    { contextValue: gqlContext },
  );

  expect.assert(body.kind === "single");
  expect(body.singleResult.errors).toBeUndefined();
  expect({ ...body.singleResult.data?.mediaItemById }).toStrictEqual({
    processorJobId: job.id,
    nextScrapeAttemptAt: new Date(
      scrapeJob.job.timestamp + delay,
    ).toISOString(),
  });
});
