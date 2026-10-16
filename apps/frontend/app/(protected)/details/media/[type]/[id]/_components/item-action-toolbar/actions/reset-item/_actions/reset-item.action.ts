"use server";

import { UUID } from "@repo/util-plugin-sdk/schemas/utilities/uuid.schema";

import { gql } from "@apollo/client";

import { getClient } from "#lib/graphql/client.ts";
import { permissionActionClient } from "#lib/server-actions/action-client.ts";

import type {
  ResetItemMutation,
  ResetItemMutationVariables,
} from "./reset-item.action.typegen";
import type { TypedDocumentNode } from "@apollo/client";

export const RESET_ITEM: TypedDocumentNode<
  ResetItemMutation,
  ResetItemMutationVariables
> = gql`
  mutation ResetItem($id: ID!) {
    resetMediaItem(mediaItemId: $id) {
      ... on MediaItem {
        id
        state
      }
    }
  }
`;

export const resetItem = permissionActionClient
  .metadata({
    permissions: {
      item: ["reset"],
    },
  })
  .bindArgsSchemas([UUID])
  .action(async ({ bindArgsParsedInputs: [id] }) => {
    const { data } = await getClient().mutate({
      mutation: RESET_ITEM,
      variables: { id },
    });

    return {
      success: Boolean(data?.resetMediaItem),
      resetItems: data?.resetMediaItem ?? [],
    };
  });
