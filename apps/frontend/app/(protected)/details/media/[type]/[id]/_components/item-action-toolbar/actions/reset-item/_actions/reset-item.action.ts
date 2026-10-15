"use server";

import { gql } from "@apollo/client";
import { z } from "zod";

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
  .bindArgsSchemas([z.uuid()])
  .action(async ({ bindArgsParsedInputs: [id] }) => {
    const { data } = await getClient().mutate({
      mutation: RESET_ITEM,
      variables: { id },
    });

    return {
      success: true,
      resetItems: data?.resetMediaItem ?? [],
    };
  });
