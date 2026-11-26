import { gql } from "@apollo/client";
import { expect } from "vitest";

import { it } from "#__tests__/test-context.ts";
import { mediaItemActionPermissions } from "#graphql/auth/media-item-action-permissions.ts";

import type {
  ItemRequestResolverSpecRequestItemMutation,
  ItemRequestResolverSpecRequestItemMutationVariables,
} from "./request-item.spec.typegen.ts";
import type { TypedDocumentNode } from "@apollo/client";

const REQUEST_ITEM: TypedDocumentNode<
  ItemRequestResolverSpecRequestItemMutation,
  ItemRequestResolverSpecRequestItemMutationVariables
> = gql`
  mutation ItemRequestResolverSpecRequestItem($input: RequestItemInput!) {
    requestItem(input: $input)
  }
`;

it("resolves for a caller with the requestSingle action's permissions", async ({
  gqlExecuteAs,
  userWith,
}) => {
  await expect(
    gqlExecuteAs(
      userWith(mediaItemActionPermissions.requestSingle),
      REQUEST_ITEM,
      {
        input: { requestedBy: "user@riven.test", tmdbId: "550", type: "movie" },
      },
    ),
  ).resolves.toStrictEqual({ data: { requestItem: true }, errors: [] });
});
