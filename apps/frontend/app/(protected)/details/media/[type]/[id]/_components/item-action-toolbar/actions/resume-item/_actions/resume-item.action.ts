"use server";

import { UUID } from "@repo/util-plugin-sdk/schemas/utilities/uuid.schema";

import { getClient } from "#lib/graphql/client.ts";
import { permissionActionClient } from "#lib/server-actions/action-client.ts";

import { RESUME_ITEM } from "../_mutations/resume-item.mutation";

export const resumeItem = permissionActionClient
  .metadata({
    permissions: {
      item: ["resume"],
    },
  })
  .bindArgsSchemas([UUID])
  .action(async ({ bindArgsParsedInputs: [id] }) => {
    const { data } = await getClient().mutate({
      mutation: RESUME_ITEM,
      variables: { id },
    });

    return {
      success: Boolean(data?.resumeMediaItem),
    };
  });
