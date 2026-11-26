import { Episode, Season } from "@repo/util-plugin-sdk/dto/entities";

import { gql } from "@apollo/client";
import { expect } from "vitest";

import { it } from "#__tests__/test-context.ts";

import type {
  MediaItemResolverSpecGetRelationsQuery,
  MediaItemResolverSpecGetRelationsQueryVariables,
  MediaItemResolverSpecGetFieldsQuery,
  MediaItemResolverSpecGetFieldsQueryVariables,
  MediaItemResolverSpecMediaItemsCountQuery,
  MediaItemResolverSpecMediaItemsCountQueryVariables,
} from "./field-resolvers.spec.typegen.ts";
import type { TypedDocumentNode } from "@apollo/client";

const GET_FIELDS: TypedDocumentNode<
  MediaItemResolverSpecGetFieldsQuery,
  MediaItemResolverSpecGetFieldsQueryVariables
> = gql`
  query MediaItemResolverSpecGetFields($id: ID!) {
    mediaItemById(id: $id) {
      ... on MediaItem {
        primaryExternalId
        childItemCount
        childItemCountWithSpecials: childItemCount(includeSpecials: true)
        hasActiveStream
        streamCount
        mediaEntryCount
        subtitlesCount
      }
    }
  }
`;

const GET_RELATIONS: TypedDocumentNode<
  MediaItemResolverSpecGetRelationsQuery,
  MediaItemResolverSpecGetRelationsQueryVariables
> = gql`
  query MediaItemResolverSpecGetRelations($id: ID!) {
    mediaItemById(id: $id) {
      ... on MediaItem {
        activeStream {
          infoHash
        }
        streams {
          infoHash
        }
        blacklistedStreams {
          __typename
        }
        filesystemEntries {
          id
        }
        mediaEntries {
          id
          originalFilename
        }
        subtitles {
          id
        }
        itemRequest {
          id
        }
      }
    }
  }
`;

const MEDIA_ITEMS_COUNT: TypedDocumentNode<
  MediaItemResolverSpecMediaItemsCountQuery,
  MediaItemResolverSpecMediaItemsCountQueryVariables
> = gql`
  query MediaItemResolverSpecMediaItemsCount($type: [MediaItemType!]) {
    mediaItemsCount(type: $type)
  }
`;

it("resolves the fields of a completed movie", async ({
  gqlContext,
  gqlServer,
  completedMovieContext: { completedMovie, streams },
}) => {
  const { body } = await gqlServer.executeOperation<
    MediaItemResolverSpecGetFieldsQuery,
    MediaItemResolverSpecGetFieldsQueryVariables
  >(
    { query: GET_FIELDS, variables: { id: completedMovie.id } },
    { contextValue: gqlContext },
  );

  expect.assert(body.kind === "single");
  expect(body.singleResult.errors).toBeUndefined();
  expect({ ...body.singleResult.data?.mediaItemById }).toStrictEqual({
    primaryExternalId: completedMovie.tmdbId,
    childItemCount: 0,
    childItemCountWithSpecials: 0,
    hasActiveStream: true,
    streamCount: streams.length,
    mediaEntryCount: 1,
    subtitlesCount: 0,
  });
});

it("resolves the fields of an indexed movie", async ({
  gqlContext,
  gqlServer,
  indexedMovieContext: { indexedMovie },
}) => {
  const { body } = await gqlServer.executeOperation<
    MediaItemResolverSpecGetFieldsQuery,
    MediaItemResolverSpecGetFieldsQueryVariables
  >(
    { query: GET_FIELDS, variables: { id: indexedMovie.id } },
    { contextValue: gqlContext },
  );

  expect.assert(body.kind === "single");
  expect(body.singleResult.errors).toBeUndefined();
  expect({ ...body.singleResult.data?.mediaItemById }).toStrictEqual({
    primaryExternalId: indexedMovie.tmdbId,
    childItemCount: 0,
    childItemCountWithSpecials: 0,
    hasActiveStream: false,
    streamCount: 0,
    mediaEntryCount: 0,
    subtitlesCount: 0,
  });
});

it("resolves the relations of a completed movie", async ({
  em,
  gqlContext,
  gqlServer,
  completedMovieContext: { completedMovie, streams },
}) => {
  const [mediaEntry] = await completedMovie.getMediaEntries();

  expect.assert(mediaEntry);
  expect.assert(completedMovie.activeStream);

  em.clear();

  const { body } = await gqlServer.executeOperation<
    MediaItemResolverSpecGetRelationsQuery,
    MediaItemResolverSpecGetRelationsQueryVariables
  >(
    { query: GET_RELATIONS, variables: { id: completedMovie.id } },
    { contextValue: gqlContext },
  );

  expect.assert(body.kind === "single");
  expect(body.singleResult.errors).toBeUndefined();
  expect(structuredClone(body.singleResult.data?.mediaItemById)).toStrictEqual({
    activeStream: { infoHash: completedMovie.activeStream.infoHash },
    streams: expect.arrayContaining(
      streams.map(({ infoHash }) => ({ infoHash })),
    ),
    blacklistedStreams: [],
    filesystemEntries: [{ id: mediaEntry.id }],
    mediaEntries: [
      { id: mediaEntry.id, originalFilename: mediaEntry.originalFilename },
    ],
    subtitles: [],
    itemRequest: { id: completedMovie.itemRequest.id },
  });
});

it("counts the seasons of a show, excluding specials unless requested", async ({
  em,
  gqlContext,
  gqlServer,
  indexedShowContext: {
    indexedShow,
    seasons: [specials, ...seasons],
  },
}) => {
  expect.assert(specials);

  // Bypasses the subscribers, which would otherwise recompute the season on flush
  await em.nativeUpdate(
    Season,
    { id: specials.id },
    { number: 0, isSpecial: true },
  );

  const { body } = await gqlServer.executeOperation<
    MediaItemResolverSpecGetFieldsQuery,
    MediaItemResolverSpecGetFieldsQueryVariables
  >(
    { query: GET_FIELDS, variables: { id: indexedShow.id } },
    { contextValue: gqlContext },
  );

  expect.assert(body.kind === "single");
  expect(body.singleResult.errors).toBeUndefined();
  expect({ ...body.singleResult.data?.mediaItemById }).toMatchObject({
    primaryExternalId: indexedShow.tvdbId,
    childItemCount: seasons.length,
    childItemCountWithSpecials: seasons.length + 1,
  });
});

it("counts the episodes of a season, excluding specials unless requested", async ({
  em,
  gqlContext,
  gqlServer,
  season,
}) => {
  const [special, ...episodes] = await season.episodes.loadItems();

  expect.assert(special);

  await em.nativeUpdate(Episode, { id: special.id }, { isSpecial: true });

  const { body } = await gqlServer.executeOperation<
    MediaItemResolverSpecGetFieldsQuery,
    MediaItemResolverSpecGetFieldsQueryVariables
  >(
    { query: GET_FIELDS, variables: { id: season.id } },
    { contextValue: gqlContext },
  );

  expect.assert(body.kind === "single");
  expect(body.singleResult.errors).toBeUndefined();
  expect({ ...body.singleResult.data?.mediaItemById }).toMatchObject({
    primaryExternalId: season.tvdbId,
    childItemCount: episodes.length,
    childItemCountWithSpecials: episodes.length + 1,
  });
});

it("counts the media items of the given types", async ({
  gqlContext,
  gqlServer,
  seeders: { seedIndexedMovie },
  indexedShowContext: { seasons, episodes },
}) => {
  await seedIndexedMovie(3);

  const countItems = async (
    variables: MediaItemResolverSpecMediaItemsCountQueryVariables,
  ) => {
    const { body } = await gqlServer.executeOperation<
      MediaItemResolverSpecMediaItemsCountQuery,
      MediaItemResolverSpecMediaItemsCountQueryVariables
    >({ query: MEDIA_ITEMS_COUNT, variables }, { contextValue: gqlContext });

    expect.assert(body.kind === "single");
    expect(body.singleResult.errors).toBeUndefined();

    return body.singleResult.data?.mediaItemsCount;
  };

  await expect(countItems({ type: ["movie"] })).resolves.toBe(3);
  await expect(countItems({ type: ["season", "episode"] })).resolves.toBe(
    seasons.length + episodes.length,
  );
  await expect(countItems({})).resolves.toBe(
    3 + 1 + seasons.length + episodes.length,
  );
});
