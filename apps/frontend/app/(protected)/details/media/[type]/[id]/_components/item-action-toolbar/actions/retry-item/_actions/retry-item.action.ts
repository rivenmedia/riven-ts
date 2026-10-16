"use server";

import { UUID } from "@repo/util-plugin-sdk/schemas/utilities/uuid.schema";

import { getClient } from "#lib/graphql/client.ts";
import { permissionActionClient } from "#lib/server-actions/action-client.ts";

import { RETRY_ITEM } from "../_mutations/retry-item.mutation";

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
