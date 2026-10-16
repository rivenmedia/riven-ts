"use server";

import { UUID } from "@repo/util-plugin-sdk/schemas/utilities/uuid.schema";

import { gql } from "@apollo/client";

import { getClient } from "#lib/graphql/client.ts";
import { permissionActionClient } from "#lib/server-actions/action-client.ts";

import type {
  ResumeItemMutation,
  ResumeItemMutationVariables,
} from "./resume-item.action.typegen";
import type { TypedDocumentNode } from "@apollo/client";

export const RESUME_ITEM: TypedDocumentNode<
  ResumeItemMutation,
  ResumeItemMutationVariables
> = gql`
  mutation ResumeItem($id: ID!) {
    resumeMediaItem(mediaItemId: $id) {
      ... on MediaItem {
        id
        state
      }
    }
  }
`;

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
