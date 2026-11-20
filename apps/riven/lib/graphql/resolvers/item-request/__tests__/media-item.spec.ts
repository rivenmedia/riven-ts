import { gql } from "@apollo/client";
import { expect } from "vitest";

import { it as baseIt } from "#__tests__/test-context.ts";

import type {
  ItemRequestResolverSpecGetMediaItemQuery,
  ItemRequestResolverSpecGetMediaItemQueryVariables,
} from "./media-item.spec.typegen.ts";
import type { TypedDocumentNode } from "@apollo/client";

const GET_MEDIA_ITEM: TypedDocumentNode<
  ItemRequestResolverSpecGetMediaItemQuery,
  ItemRequestResolverSpecGetMediaItemQueryVariables
> = gql`
  query ItemRequestResolverSpecGetMediaItem(
    $tmdbId: String
    $tvdbId: String
    $type: MediaItemType!
    $seasonNumber: Int
    $episodeNumber: Int
  ) {
    itemRequestByExternalIds(tmdbId: $tmdbId, tvdbId: $tvdbId) {
      primaryMediaItem {
        __typename
        ... on MediaItem {
          id
        }
      }
      mediaItem(
        type: $type
        seasonNumber: $seasonNumber
        episodeNumber: $episodeNumber
      ) {
        __typename
        ... on MediaItem {
          id
        }
      }
    }
  }
`;

const it = baseIt.extend(
  "getMediaItem",
  ({ gqlContext, gqlServer }) =>
    async (variables: ItemRequestResolverSpecGetMediaItemQueryVariables) => {
      const { body } = await gqlServer.executeOperation<
        ItemRequestResolverSpecGetMediaItemQuery,
        ItemRequestResolverSpecGetMediaItemQueryVariables
      >({ query: GET_MEDIA_ITEM, variables }, { contextValue: gqlContext });

      expect.assert(body.kind === "single");

      return body.singleResult;
    },
);

it("returns the requested movie", async ({
  completedMovieContext: { completedMovie },
  getMediaItem,
}) => {
  const { data, errors } = await getMediaItem({
    tmdbId: completedMovie.tmdbId,
    type: "movie",
  });

  expect(errors).toBeUndefined();
  expect(data?.itemRequestByExternalIds).toStrictEqual(
    expect.objectContaining({
      primaryMediaItem: expect.objectContaining({
        __typename: "Movie",
        id: completedMovie.id,
      }),
      mediaItem: expect.objectContaining({
        __typename: "Movie",
        id: completedMovie.id,
      }),
    }),
  );
});

it("returns the requested show", async ({
  indexedShowContext: { indexedShow },
  getMediaItem,
}) => {
  const { data, errors } = await getMediaItem({
    tvdbId: indexedShow.tvdbId,
    type: "show",
  });

  expect(errors).toBeUndefined();
  expect(data?.itemRequestByExternalIds?.mediaItem).toStrictEqual(
    expect.objectContaining({ __typename: "Show", id: indexedShow.id }),
  );
});

it("returns a season of the requested show by its number", async ({
  indexedShowContext: { indexedShow, seasons },
  getMediaItem,
}) => {
  const season = seasons.find(({ number }) => number === 2);

  expect.assert(season);

  const { data, errors } = await getMediaItem({
    tvdbId: indexedShow.tvdbId,
    type: "season",
    seasonNumber: 2,
  });

  expect(errors).toBeUndefined();
  expect(data?.itemRequestByExternalIds?.mediaItem).toStrictEqual(
    expect.objectContaining({ __typename: "Season", id: season.id }),
  );
});

it("returns an episode of the requested show by its season and episode number", async ({
  indexedShowContext: { indexedShow, episodes },
  getMediaItem,
}) => {
  const episode = episodes.find(
    ({ number, season }) => number === 3 && season.unwrap().number === 2,
  );

  expect.assert(episode);

  const { data, errors } = await getMediaItem({
    tvdbId: indexedShow.tvdbId,
    type: "episode",
    seasonNumber: 2,
    episodeNumber: 3,
  });

  expect(errors).toBeUndefined();
  expect(data?.itemRequestByExternalIds?.mediaItem).toStrictEqual(
    expect.objectContaining({ __typename: "Episode", id: episode.id }),
  );
});

it.for([
  {
    scenario: "a season without a season number",
    variables: { type: "season" },
    error: "Season number must be provided for season type media items.",
  },
  {
    scenario: "an episode without an episode number",
    variables: { type: "episode", seasonNumber: 2 },
    error:
      "Season number and episode number must be provided for episode type media items.",
  },
  {
    scenario: "a season that does not exist",
    variables: { type: "season", seasonNumber: 99 },
    error: "Season number 99 not found for this item request.",
  },
  {
    scenario: "an episode that does not exist",
    variables: { type: "episode", seasonNumber: 2, episodeNumber: 99 },
    error: "Episode number 99 not found for season 2 in this item request.",
  },
] as const)(
  "returns an error when requesting $scenario",
  async (
    { variables, error },
    { indexedShowContext: { indexedShow }, getMediaItem },
  ) => {
    const { errors } = await getMediaItem({
      tvdbId: indexedShow.tvdbId,
      ...variables,
    });

    expect(errors).toMatchObject([{ message: error }]);
  },
);
