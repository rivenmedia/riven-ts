"use server";

import { UUID } from "@repo/util-plugin-sdk/schemas/utilities/uuid.schema";

import { getClient } from "#lib/graphql/client.ts";
import { permissionActionClient } from "#lib/server-actions/action-client.ts";

import { BLACKLIST_ACTIVE_STREAM } from "../_mutations/blacklist-active-stream.mutation";

export const blacklistActiveStream = permissionActionClient
  .metadata({
    permissions: {
      item: ["reset"],
    },
  })
  .bindArgsSchemas([UUID])
  .action(async ({ bindArgsParsedInputs: [id] }) => {
    const { data } = await getClient().mutate({
      mutation: BLACKLIST_ACTIVE_STREAM,
      variables: { id },
    });

    if (!data?.blacklistActiveStream) {
      throw new Error("Failed to blacklist active stream");
    }

    return {
      success: true,
    };
  });
