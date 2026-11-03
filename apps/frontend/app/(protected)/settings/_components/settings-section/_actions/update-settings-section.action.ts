"use server";

import { returnValidationErrors } from "next-safe-action";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getClient } from "#lib/graphql/client.ts";
import { permissionActionClient } from "#lib/server-actions/action-client.ts";

import { UPDATE_SETTINGS_SECTION } from "../_mutations/update-settings-section.mutation";
import { issuesToValidationErrors } from "../_utilities/issues-to-validation-errors";

import type { ValidationErrors } from "next-safe-action";

const inputSchema = z.object({
  values: z.record(z.string(), z.unknown()),
  /** Dotted paths of fields whose stored values are removed. */
  reset: z.array(z.string()),
});

export const updateSettingsSection = permissionActionClient
  .metadata({ permissions: { instance: ["manage-settings"] } })
  .bindArgsSchemas([z.string()])
  .inputSchema(inputSchema)
  .action(
    async ({ bindArgsParsedInputs: [id], parsedInput: { values, reset } }) => {
      const { data } = await getClient().mutate({
        mutation: UPDATE_SETTINGS_SECTION,
        variables: { id, values, reset },
      });

      if (!data) {
        throw new Error("Failed to save settings");
      }

      const { issues, success } = data.updateSettingsSection;

      if (issues.length > 0) {
        // Issues are keyed by the form's field paths rather than the input's
        // shape, as the errors are only read by mapping them onto the fields
        returnValidationErrors(
          inputSchema,
          issuesToValidationErrors(issues) as ValidationErrors<
            typeof inputSchema
          >,
        );
      }

      if (!success) {
        throw new Error("Failed to save settings");
      }

      revalidatePath("/settings", "layout");

      return { success };
    },
  );
