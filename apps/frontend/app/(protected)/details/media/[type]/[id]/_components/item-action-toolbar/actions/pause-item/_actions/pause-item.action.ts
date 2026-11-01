"use server";

import { UUID } from "@repo/util-plugin-sdk/schemas/utilities/uuid.schema";

import { getClient } from "#lib/graphql/client.ts";
import { permissionActionClient } from "#lib/server-actions/action-client.ts";

import { PAUSE_ITEM } from "../_mutations/pause-item.mutation";

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
