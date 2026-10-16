"use server";

import { atLeastOnePropertyRequired } from "@repo/util-plugin-sdk/validation";

import { z } from "zod";

import { getClient } from "#lib/graphql/client.ts";
import { permissionActionClient } from "#lib/server-actions/action-client.ts";

import { REQUEST_ITEM } from "../_mutations/request-item.mutation";

export const requestItem = permissionActionClient
  .metadata({
    permissions: {
      item: ["request"],
    },
  })
  .inputSchema(z.record(z.string(), z.unknown()))
  .bindArgsSchemas([
    z
      .object({
        tmdbId: z.string().nullish(),
        tvdbId: z.string().nullish(),
        imdbId: z.string().nullish(),
      })
      .refine(atLeastOnePropertyRequired),
  ])
  .action(
    async ({ bindArgsParsedInputs: [{ tmdbId, tvdbId, imdbId }], ctx }) => {
      const { data } = await getClient().mutate({
        mutation: REQUEST_ITEM,
        variables: {
          input: {
            ...(tmdbId && { tmdbId }),
            ...(tvdbId && { tvdbId }),
            ...(imdbId && { imdbId }),
            requestedBy: ctx.auth.user.email,
          },
        },
      });

      return {
        success: data?.requestItem ?? false,
      };
    },
  );
