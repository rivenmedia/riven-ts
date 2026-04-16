import { type TypedDocumentNode, gql } from "@apollo/client";

import { client } from "../../../graphql/apollo-client.ts";
import { logger } from "../../../utilities/logger/logger.ts";
import { requestContentServicesProcessorSchema } from "./request-content-services.schema.ts";

import type {
  RequestItemFieldsFragment,
  RequestMovieMutation,
  RequestMovieMutationVariables,
  RequestShowMutation,
  RequestShowMutationVariables,
} from "./request-content-services.processor.typegen.ts";
import type { ContentServiceRequestedResponse } from "@repo/util-plugin-sdk/schemas/events/content-service-requested.event";

const REQUEST_ITEM_FIELDS_FRAGMENT: TypedDocumentNode<RequestItemFieldsFragment> = gql`
  fragment RequestItemFields on ItemRequest {
    id
    type
    imdbId
    tmdbId
    tvdbId
    seasons
  }
`;

const REQUEST_MOVIE_MUTATION: TypedDocumentNode<
  RequestMovieMutation,
  RequestMovieMutationVariables
> = gql`
  mutation RequestMovie($input: MovieRequestInput!) {
    requestMovie(input: $input) {
      statusText
      message
      item {
        ...RequestItemFields
        id
      }
    }
  }

  ${REQUEST_ITEM_FIELDS_FRAGMENT}
`;

const REQUEST_SHOW_MUTATION: TypedDocumentNode<
  RequestShowMutation,
  RequestShowMutationVariables
> = gql`
  mutation RequestShow($input: ShowRequestInput!) {
    requestShow(input: $input) {
      statusText
      message
      item {
        ...RequestItemFields
        id
      }
    }
  }

  ${REQUEST_ITEM_FIELDS_FRAGMENT}
`;

function buildExternalIdKey(
  /**
   * The primary external ID for the movie or show. This could be the TMDB ID for movies or the TVDB ID for shows.
   */
  primaryExternalKey: string | null | undefined,
  /**
   * The IMDB ID for the movie or show. This is used as a fallback if the primary external ID is not available.
   */
  imdbKey: string | null | undefined,
) {
  if (!primaryExternalKey && !imdbKey) {
    return null;
  }

  return primaryExternalKey ?? imdbKey;
}

async function requestItem(
  item: ContentServiceRequestedResponse["movies" | "shows"][number],
) {
  if ("tmdbId" in item) {
    return client.mutate({
      mutation: REQUEST_MOVIE_MUTATION,
      variables: {
        input: {
          imdbId: item.imdbId ?? null,
          tmdbId: item.tmdbId ?? null,
          requestedBy: item.requestedBy ?? null,
          externalRequestId: item.externalRequestId ?? null,
        },
      },
    });
  }

  if ("tvdbId" in item) {
    return client.mutate({
      mutation: REQUEST_SHOW_MUTATION,
      variables: {
        input: {
          imdbId: item.imdbId ?? null,
          tvdbId: item.tvdbId ?? null,
          requestedBy: item.requestedBy ?? null,
          externalRequestId: item.externalRequestId ?? null,
          seasons: item.seasons ?? null,
        },
      },
    });
  }

  throw new Error(
    `Invalid item with no recognisable external IDs: ${JSON.stringify(item)}`,
  );
}

export const requestContentServicesProcessor =
  requestContentServicesProcessorSchema.implementAsync(async ({ job }) => {
    const data = await job.getChildrenValues();

    const items = Object.values(data).reduce((acc, childData) => {
      if (childData.movies.length) {
        for (const movie of childData.movies) {
          const key = buildExternalIdKey(movie.tmdbId, movie.imdbId);

          if (!key) {
            logger.warn(
              `Skipping requested movie with no valid external ID: ${JSON.stringify(movie)}`,
            );

            continue;
          }

          acc.set(key, movie);
        }
      }

      if (childData.shows.length) {
        for (const show of childData.shows) {
          const key = buildExternalIdKey(show.tvdbId, show.imdbId);

          if (!key) {
            logger.warn(
              `Skipping requested show with no valid external ID: ${JSON.stringify(show)}`,
            );

            continue;
          }

          acc.set(key, show);
        }
      }

      return acc;
    }, new Map<string, ContentServiceRequestedResponse["movies" | "shows"][number]>());

    let newItemsCount = 0;
    let updatedItemsCount = 0;

    for (const [key, item] of items) {
      const result = await requestItem(item);

      if (!result.data) {
        logger.error(
          `No data returned from requestItem for item with key ${key}`,
        );

        continue;
      }

      if ("requestMovie" in result.data && result.data.requestMovie.item) {
        const fragmentData = client.readFragment({
          id: client.cache.identify(result.data.requestMovie.item),
          fragment: REQUEST_ITEM_FIELDS_FRAGMENT,
        });

        if (!fragmentData) {
          logger.error(
            `Failed to read fragment for ${client.cache.identify(result.data.requestMovie.item)}`,
          );

          continue;
        }

        switch (result.data.requestMovie.statusText) {
          case "conflict": {
            // sendEvent({
            //   type: "riven.item-request.create.error.conflict",
            //   item: fragmentData,
            // });

            break;
          }
          case "created": {
            newItemsCount++;

            break;
          }
          default: {
            logger.warn(
              `Unexpected response code ${result.data.requestMovie.statusText} for movie request with item key ${key}`,
            );
          }
        }
      }

      if ("requestShow" in result.data && result.data.requestShow.item) {
        const fragmentData = client.readFragment({
          id: client.cache.identify(result.data.requestShow.item),
          fragment: REQUEST_ITEM_FIELDS_FRAGMENT,
        });

        if (!fragmentData) {
          logger.error(
            `Failed to read fragment for ${client.cache.identify(result.data.requestShow.item)}`,
          );

          continue;
        }

        switch (result.data.requestShow.statusText) {
          case "conflict": {
            // sendEvent({
            //   type: "riven.item-request.create.error.conflict",
            //   item: fragmentData,
            // });

            break;
          }
          case "created": {
            newItemsCount++;

            break;
          }
          case "ok": {
            updatedItemsCount++;

            break;
          }
          default: {
            logger.warn(
              `Unexpected response code ${result.data.requestShow.statusText} for show request with item key ${key}`,
            );
          }
        }
      }
    }

    return {
      count: items.size,
      newItems: newItemsCount,
      updatedItems: updatedItemsCount,
    };
  });
