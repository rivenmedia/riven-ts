"use server";

import { atLeastOnePropertyRequired } from "@repo/util-plugin-sdk/validation";

import { gql } from "@apollo/client";
import { z } from "zod";

import { getClient } from "#lib/graphql/client.ts";
import { permissionActionClient } from "#lib/server-actions/action-client.ts";

import type {
  RequestItemMutation,
  RequestItemMutationVariables,
} from "./request-item.action.typegen";
import type { TypedDocumentNode } from "@apollo/client";

const REQUEST_ITEM: TypedDocumentNode<
  RequestItemMutation,
  RequestItemMutationVariables
> = gql`
  mutation RequestItem($input: RequestItemInput!) {
    requestItem(input: $input)
  }
`;

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
    async ({
      parsedInput,
      bindArgsParsedInputs: [{ tmdbId, tvdbId, imdbId }],
      ctx,
    }) => {
      const { data, error } = await getClient().mutate({
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

      console.log("requesting item", parsedInput, { data, error });

      return null;
    },
  );
