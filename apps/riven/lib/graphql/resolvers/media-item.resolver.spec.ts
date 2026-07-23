import { gql } from "@apollo/client";
import { expect, vi } from "vitest";

import { it } from "../../__tests__/test-context.ts";

import type {
  RemoveMediaItemMutation,
  RemoveMediaItemMutationVariables,
} from "./media-item.resolver.spec.typegen.ts";
import type { TypedDocumentNode } from "@apollo/client";

it.describe("removeMediaItem", () => {
  const REMOVE_MEDIA_ITEM: TypedDocumentNode<
    RemoveMediaItemMutation,
    RemoveMediaItemMutationVariables
  > = gql`
    mutation RemoveMediaItem($id: ID!) {
      removeMediaItem(id: $id)
    }
  `;

  it("removes the requested media item", async ({
    completedMovieContext: { completedMovie },
    gqlContext,
    gqlServer,
    services,
  }) => {
    const removeMediaItemSpy = vi.spyOn(
      services.mediaItemService,
      "removeMediaItem",
    );

    await gqlServer.executeOperation(
      {
        query: REMOVE_MEDIA_ITEM,
        variables: {
          id: completedMovie.id,
        },
      },
      { contextValue: gqlContext },
    );

    expect(removeMediaItemSpy).toHaveBeenCalledWith(
      expect.objectContaining({ id: completedMovie.id }),
    );
  });

  it("returns true", async ({
    completedMovieContext: { completedMovie },
    gqlContext,
    gqlServer,
  }) => {
    const { body } = await gqlServer.executeOperation<
      RemoveMediaItemMutation,
      RemoveMediaItemMutationVariables
    >(
      {
        query: REMOVE_MEDIA_ITEM,
        variables: {
          id: completedMovie.id,
        },
      },
      { contextValue: gqlContext },
    );

    expect.assert(body.kind === "single");

    expect(body.singleResult.errors).toBeUndefined();
    expect(body.singleResult.data?.removeMediaItem).toBe(true);
  });
});
