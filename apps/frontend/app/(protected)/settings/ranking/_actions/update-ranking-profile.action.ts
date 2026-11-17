"use server";

import { returnValidationErrors } from "next-safe-action";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { getClient } from "#lib/graphql/client.ts";
import { permissionActionClient } from "#lib/server-actions/action-client.ts";

import { issuesToValidationErrors } from "../../_components/settings-section/_utilities/issues-to-validation-errors";
import { UPDATE_RANKING_PROFILE } from "../_mutations/update-ranking-profile.mutation";

import type { ValidationErrors } from "next-safe-action";

const inputSchema = z.object({
  /** The profile form's values, which the backend validates. */
  values: z.record(z.string(), z.unknown()),
});

export const updateRankingProfile = permissionActionClient
  .metadata({ permissions: { instance: ["manage-settings"] } })
  .bindArgsSchemas([z.string()])
  .inputSchema(inputSchema)
  .action(async ({ bindArgsParsedInputs: [id], parsedInput: { values } }) => {
    const { data } = await getClient().mutate({
      mutation: UPDATE_RANKING_PROFILE,
      variables: { id, values },
    });

    if (!data) {
      throw new Error("Failed to save the ranking profile");
    }

    const { issues, success } = data.updateRankingProfile;

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
      throw new Error("Failed to save the ranking profile");
    }

    revalidatePath("/settings/ranking", "layout");
    redirect("/settings/ranking");
  });
