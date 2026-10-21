"use server";

import { UUID } from "@repo/util-plugin-sdk/schemas/utilities/uuid.schema";

import { getClient } from "#lib/graphql/client.ts";
import { permissionActionClient } from "#lib/server-actions/action-client.ts";

import { RESET_ITEM } from "../_mutations/reset-item.mutation";

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
