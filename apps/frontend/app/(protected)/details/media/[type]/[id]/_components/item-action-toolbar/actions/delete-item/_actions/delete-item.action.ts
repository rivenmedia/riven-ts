"use server";

import { gql } from "@apollo/client";
import z from "zod";

import { getClient } from "#lib/graphql/client.ts";
import { permissionActionClient } from "#lib/server-actions/action-client.ts";

import type {
  DeleteItemRequestMutation,
  DeleteItemRequestMutationVariables,
} from "./delete-item.action.typegen.ts";
import type { TypedDocumentNode } from "@apollo/client";

export const DELETE_ITEM_REQUEST: TypedDocumentNode<
  DeleteItemRequestMutation,
  DeleteItemRequestMutationVariables
> = gql`
  mutation DeleteItemRequest($id: ID!) {
    removeItemRequest(itemRequestId: $id)
  }
`;

export const deleteItem = permissionActionClient
  .metadata({
    permissions: {
      item: ["delete"],
    },
  })
  .bindArgsSchemas([z.uuid()])
  .action(async ({ bindArgsParsedInputs: [id] }) => {
    const { data } = await getClient().mutate({
      mutation: DELETE_ITEM_REQUEST,
      variables: {
        id,
      },
    });

    return {
      success: data?.removeItemRequest ?? false,
    };
  });
