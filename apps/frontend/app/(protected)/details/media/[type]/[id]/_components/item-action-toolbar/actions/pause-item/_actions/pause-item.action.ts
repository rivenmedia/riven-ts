"use server";

import { UUID } from "@repo/util-plugin-sdk/schemas/utilities/uuid.schema";

import { gql } from "@apollo/client";

import { getClient } from "#lib/graphql/client.ts";
import { permissionActionClient } from "#lib/server-actions/action-client.ts";

import type {
  PauseItemMutation,
  PauseItemMutationVariables,
} from "./pause-item.action.typegen";
import type { TypedDocumentNode } from "@apollo/client";

export const PAUSE_ITEM: TypedDocumentNode<
  PauseItemMutation,
  PauseItemMutationVariables
> = gql`
  mutation PauseItem($id: ID!) {
    pauseMediaItem(mediaItemId: $id) {
      ... on MediaItem {
        id
        state
      }
    }
  }
`;

export const pauseItem = permissionActionClient
  .metadata({
    permissions: {
      item: ["pause"],
    },
  })
  .bindArgsSchemas([UUID])
  .action(async ({ bindArgsParsedInputs: [id] }) => {
    const { data } = await getClient().mutate({
      mutation: PAUSE_ITEM,
      variables: { id },
    });

    return {
      success: Boolean(data?.pauseMediaItem),
    };
  });
