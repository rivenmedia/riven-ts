import { type TypedDocumentNode, gql } from "@apollo/client";
import { UnrecoverableError } from "bullmq";

import { client } from "../../../graphql/apollo-client.ts";
import { requestIndexDataProcessorSchema } from "./index-item.schema.ts";

import type {
  IndexMovieMutation,
  IndexMovieMutationVariables,
  IndexShowMutation,
  IndexShowMutationVariables,
} from "./index-item.processor.typegen.ts";
import type { MediaItemIndexRequestedResponse } from "@repo/util-plugin-sdk/schemas/events/media-item.index.requested.event";

const INDEX_MOVIE_MUTATION: TypedDocumentNode<
  IndexMovieMutation,
  IndexMovieMutationVariables
> = gql`
  mutation IndexMovie($input: IndexMovieInput!) {
    indexMovie(input: $input) {
      success
      statusText
      message
      movie {
        id
        fullTitle
      }
    }
  }
`;

const INDEX_SHOW_MUTATION: TypedDocumentNode<
  IndexShowMutation,
  IndexShowMutationVariables
> = gql`
  mutation IndexShow($input: IndexShowInput!) {
    indexShow(input: $input) {
      success
      statusText
      message
      show {
        id
        fullTitle
        type
        state
        status
      }
    }
  }
`;

export const indexItemProcessor =
  requestIndexDataProcessorSchema.implementAsync(async function (
    { job },
    sendEvent,
  ) {
    const data = await job.getChildrenValues();

    if (!Object.values(data).filter(Boolean).length) {
      throw new UnrecoverableError("No data returned from indexers");
    }

    const item = Object.values(data).reduce(
      (acc, value) => {
        if (!value?.item) {
          return acc;
        }

        return Object.assign(acc, value.item);
      },
      {} as NonNullable<MediaItemIndexRequestedResponse>["item"],
    );

    switch (item.type) {
      case "movie": {
        const updatedItem = await client.mutate({
          mutation: INDEX_MOVIE_MUTATION,
          variables: {
            input: item,
          },
        });

        if (!updatedItem.data?.indexMovie.success) {
          throw new UnrecoverableError("Failed to index movie");
        }

        break;
      }
      case "show": {
        const updatedItem = await client.mutate({
          mutation: INDEX_SHOW_MUTATION,
          variables: {
            input: item,
          },
        });

        if (!updatedItem.data?.indexShow.success) {
          throw new UnrecoverableError("Failed to index show");
        }

        break;
      }
    }
  });
