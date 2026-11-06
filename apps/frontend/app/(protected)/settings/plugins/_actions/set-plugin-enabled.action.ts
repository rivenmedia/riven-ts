"use server";

import { returnValidationErrors } from "next-safe-action";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getClient } from "#lib/graphql/client.ts";
import { permissionActionClient } from "#lib/server-actions/action-client.ts";

import { SET_PLUGIN_ENABLED } from "../_mutations/set-plugin-enabled.mutation";

const inputSchema = z.object({ id: z.string(), enabled: z.boolean() });

export const setPluginEnabled = permissionActionClient
  .metadata({ permissions: { instance: ["manage-settings"] } })
  .inputSchema(inputSchema)
  .action(async ({ parsedInput: { id, enabled } }) => {
    const { data } = await getClient().mutate({
      mutation: SET_PLUGIN_ENABLED,
      variables: { id, enabled },
    });

    if (!data) {
      throw new Error("Failed to update the plugin");
    }

    const { issues, success } = data.setPluginEnabled;

    if (issues.length > 0) {
      // Issues are about the plugin list as a whole, so they're form-level
      returnValidationErrors(inputSchema, {
        _errors: issues.map(({ message }) => message),
      });
    }

    if (!success) {
      throw new Error("Failed to update the plugin");
    }

    revalidatePath("/settings", "layout");

    return { success };
  });
