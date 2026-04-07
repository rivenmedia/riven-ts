import { ItemRequestCreateErrorConflict } from "@repo/util-plugin-sdk/schemas/events/item-request.create.error.conflict.event";
import { ItemRequestCreateError } from "@repo/util-plugin-sdk/schemas/events/item-request.create.error.event";

import { type TypedDocumentNode, gql } from "@apollo/client";

import { client } from "../../../utilities/apollo-client.ts";
import { requestContentServicesProcessorSchema } from "./request-content-services.schema.ts";

import type {
  PersistMovieItemRequestMutation,
  PersistMovieItemRequestMutationVariables,
  PersistShowItemRequestMutation,
  PersistShowItemRequestMutationVariables,
} from "./request-content-services.processor.typegen.ts";
import type { ContentServiceRequestedResponse } from "@repo/util-plugin-sdk/schemas/events/content-service-requested.event";

const PERSIST_MOVIE_ITEM_REQUEST_MUTATION: TypedDocumentNode<
  PersistMovieItemRequestMutation,
  PersistMovieItemRequestMutationVariables
> = gql`
  mutation PersistMovieItemRequest($input: PersistMovieItemRequestInput!) {
    persistMovieItemRequest(input: $input) {
      requestType
      item {
        id
        tvdbId
        tmdbId
        imdbId
      }
    }
  }
`;

const PERSIST_SHOW_ITEM_REQUEST_MUTATION: TypedDocumentNode<
  PersistShowItemRequestMutation,
  PersistShowItemRequestMutationVariables
> = gql`
  mutation PersistShowItemRequest($input: PersistShowItemRequestInput!) {
    persistShowItemRequest(input: $input) {
      requestType
      item {
        id
      }
    }
  }
`;

export const requestContentServicesProcessor =
  requestContentServicesProcessorSchema.implementAsync(
    async ({ job }, sendEvent) => {
      const data = await job.getChildrenValues();

      const items = Object.values(data).reduce<ContentServiceRequestedResponse>(
        (acc, childData) => {
          if (childData.movies.length) {
            acc.movies.push(...childData.movies);
          }

          if (childData.shows.length) {
            acc.shows.push(...childData.shows);
          }

          return acc;
        },
        {
          movies: [],
          shows: [],
        },
      );

      const movieResults = await Promise.allSettled(
        items.movies.map((item) =>
          client.mutate({
            mutation: PERSIST_MOVIE_ITEM_REQUEST_MUTATION,
            variables: {
              input: item,
            },
          }),
        ),
      );

      let newMovies = 0;
      let updatedMovies = 0;

      for (const result of movieResults) {
        if (result.status === "fulfilled") {
          if (result.value.data?.persistMovieItemRequest) {
            if (
              result.value.data.persistMovieItemRequest.requestType === "create"
            ) {
              newMovies += 1;
            } else {
              updatedMovies += 1;
            }
          }
        } else {
          if (
            result.reason instanceof ItemRequestCreateError ||
            result.reason instanceof ItemRequestCreateErrorConflict
          ) {
            sendEvent(result.reason.payload);
          }
        }
      }

      let newShows = 0;
      let updatedShows = 0;

      const showResults = await Promise.allSettled(
        items.shows.map((item) =>
          client.mutate({
            mutation: PERSIST_SHOW_ITEM_REQUEST_MUTATION,
            variables: {
              input: item,
            },
          }),
        ),
      );

      for (const result of showResults) {
        if (result.status === "fulfilled") {
          if (result.value.data?.persistShowItemRequest) {
            if (
              result.value.data.persistShowItemRequest.requestType === "create"
            ) {
              newShows += 1;
            } else {
              updatedShows += 1;
            }
          }
        } else {
          if (
            result.reason instanceof ItemRequestCreateError ||
            result.reason instanceof ItemRequestCreateErrorConflict
          ) {
            sendEvent(result.reason.payload);
          }
        }
      }

      return {
        count: items.movies.length + items.shows.length,
        movies: {
          new: newMovies,
          updated: updatedMovies,
        },
        shows: {
          new: newShows,
          updated: updatedShows,
        },
      };
    },
  );
