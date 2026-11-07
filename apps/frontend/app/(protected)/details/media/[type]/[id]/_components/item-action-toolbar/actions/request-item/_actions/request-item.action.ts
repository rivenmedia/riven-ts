"use server";

import { getClient } from "#lib/graphql/client.ts";
import { permissionActionClient } from "#lib/server-actions/action-client.ts";

import { REQUEST_ITEM } from "../_mutations/request-item.mutation";
import { ExternalIds } from "../_schemas/external-ids.schema";
import { RequestShowFormSchema } from "../_schemas/request-show.form-schema";

export const requestItem = permissionActionClient
  .metadata({
    permissions: {
      item: ["request"],
    },
  })
  .inputSchema(RequestShowFormSchema)
  .bindArgsSchemas([ExternalIds])
  .action(
    async ({
      parsedInput: { requestedSeasons },
      bindArgsParsedInputs: [{ tmdbId, tvdbId, imdbId }],
      ctx,
    }) => {
      const { data } = await getClient().mutate({
        mutation: REQUEST_ITEM,
        variables: {
          input: {
            ...(tmdbId && { tmdbId }),
            ...(tvdbId && { tvdbId }),
            ...(imdbId && { imdbId }),
            requestedBy: ctx.auth.user.email,
            ...(requestedSeasons
              ? {
                  requestedSeasons: Object.keys(requestedSeasons).map(Number),
                  type: "show",
                }
              : {
                  type: "movie",
                }),
          },
        },
      });

      return {
        success: data?.requestItem ?? false,
      };
    },
  );
