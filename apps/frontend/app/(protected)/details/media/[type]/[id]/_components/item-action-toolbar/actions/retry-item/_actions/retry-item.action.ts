import { UUID } from "@repo/util-plugin-sdk/schemas/utilities/uuid.schema";

import { gql } from "@apollo/client";

import { getClient } from "#lib/graphql/client.ts";
import { permissionActionClient } from "#lib/server-actions/action-client.ts";

import type {
  RetryItemMutation,
  RetryItemMutationVariables,
} from "./retry-item.action.typegen";
import type { TypedDocumentNode } from "@apollo/client";

export const RETRY_ITEM: TypedDocumentNode<
  RetryItemMutation,
  RetryItemMutationVariables
> = gql`
  mutation RetryItem($id: ID!) {
    retryMediaItem(mediaItemId: $id) {
      ... on MediaItem {
        id
        state
      }
    }
  }
`;

export const retryItem = permissionActionClient
  .metadata({
    permissions: {
      item: ["retry"],
    },
  })
  .bindArgsSchemas([UUID])
  .action(async ({ bindArgsParsedInputs: [id] }) => {
    const { data } = await getClient().mutate({
      mutation: RETRY_ITEM,
      variables: { id },
    });

    return {
      success: Boolean(data?.retryMediaItem),
    };
  });
