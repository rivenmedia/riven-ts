"use server";

import { returnValidationErrors } from "next-safe-action";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getClient } from "#lib/graphql/client.ts";
import { permissionActionClient } from "#lib/server-actions/action-client.ts";

import { issuesToValidationErrors } from "../../_components/settings-section/_utilities/issues-to-validation-errors";
import { DUPLICATE_RANKING_PROFILE } from "../_mutations/duplicate-ranking-profile.mutation";

import type { ValidationErrors } from "next-safe-action";

const inputSchema = z.object({ id: z.string() });

export const duplicateRankingProfile = permissionActionClient
  .metadata({ permissions: { instance: ["manage-settings"] } })
  .inputSchema(inputSchema)
  .action(async ({ parsedInput: { id } }) => {
    const { data } = await getClient().mutate({
      mutation: DUPLICATE_RANKING_PROFILE,
      variables: { id },
    });

    if (!data) {
      throw new Error("Failed to duplicate the ranking profile");
    }

    const { issues, success } = data.duplicateRankingProfile;

    if (issues.length > 0) {
      returnValidationErrors(
        inputSchema,
        issuesToValidationErrors(issues) as ValidationErrors<
          typeof inputSchema
        >,
      );
    }

    if (!success) {
      throw new Error("Failed to duplicate the ranking profile");
    }

    revalidatePath("/settings/ranking", "layout");

    return { success };
  });
