"use server";

import { returnValidationErrors } from "next-safe-action";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getClient } from "#lib/graphql/client.ts";
import { permissionActionClient } from "#lib/server-actions/action-client.ts";

import { RESET_SETTINGS_FIELDS } from "../_mutations/reset-settings-fields.mutation";
import { issuesToValidationErrors } from "../_utilities/issues-to-validation-errors";

const inputSchema = z.object({ paths: z.array(z.string()) });

export const resetSettingsFields = permissionActionClient
  .metadata({ permissions: { instance: ["manage-settings"] } })
  .bindArgsSchemas([z.string()])
  .inputSchema(inputSchema)
  .action(async ({ bindArgsParsedInputs: [id], parsedInput: { paths } }) => {
    const { data } = await getClient().mutate({
      mutation: RESET_SETTINGS_FIELDS,
      variables: { id, paths },
    });

    if (!data) {
      throw new Error("Failed to reset settings");
    }

    const { issues, success } = data.resetSettingsFields;

    if (issues.length > 0) {
      returnValidationErrors(inputSchema, issuesToValidationErrors(issues));
    }

    if (!success) {
      throw new Error("Failed to reset settings");
    }

    revalidatePath("/settings", "layout");

    return { success };
  });
