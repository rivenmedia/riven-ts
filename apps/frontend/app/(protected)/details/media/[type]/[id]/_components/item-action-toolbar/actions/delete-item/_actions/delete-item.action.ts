"use server";

import { UUID } from "@repo/util-plugin-sdk/schemas/utilities/uuid.schema";

import { getClient } from "#lib/graphql/client.ts";
import { permissionActionClient } from "#lib/server-actions/action-client.ts";

import { DELETE_ITEM_REQUEST } from "../_mutations/delete-item-request.mutation";

export const deleteItem = permissionActionClient
  .metadata({
    permissions: {
      item: ["delete"],
    },
  })
  .bindArgsSchemas([UUID])
  .action(async ({ bindArgsParsedInputs: [id] }) => {
    const { data } = await getClient().mutate({
      mutation: DELETE_ITEM_REQUEST,
      variables: { id },
    });

    return {
      success: Boolean(data?.removeItemRequest),
    };
  });
