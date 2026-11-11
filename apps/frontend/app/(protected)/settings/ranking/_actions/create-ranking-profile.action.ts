"use server";

import { returnValidationErrors } from "next-safe-action";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { getClient } from "#lib/graphql/client.ts";
import { permissionActionClient } from "#lib/server-actions/action-client.ts";

import { issuesToValidationErrors } from "../../_components/settings-section/_utilities/issues-to-validation-errors";
import { CREATE_RANKING_PROFILE } from "../_mutations/create-ranking-profile.mutation";

import type { ValidationErrors } from "next-safe-action";

const inputSchema = z.object({
  /** The profile form's values, which the backend validates. */
  values: z.record(z.string(), z.unknown()),
});

export const createRankingProfile = permissionActionClient
  .metadata({ permissions: { instance: ["manage-settings"] } })
  .inputSchema(inputSchema)
  .action(async ({ parsedInput: { values } }) => {
    const { data } = await getClient().mutate({
      mutation: CREATE_RANKING_PROFILE,
      variables: { values },
    });

    if (!data) {
      throw new Error("Failed to create the ranking profile");
    }

    const { issues, success } = data.createRankingProfile;

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
      throw new Error("Failed to create the ranking profile");
    }

    revalidatePath("/settings/ranking", "layout");
    redirect("/settings/ranking");
  });
