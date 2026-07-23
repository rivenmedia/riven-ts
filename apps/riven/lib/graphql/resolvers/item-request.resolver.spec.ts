import { gql } from "@apollo/client";
import { describe, expect, vi } from "vitest";

import { it } from "../../__tests__/test-context.ts";
import { CoreKey } from "../context.ts";

import type {
  RemoveItemRequestMutation,
  RemoveItemRequestMutationVariables,
} from "./item-request.resolver.spec.typegen.ts";
import type { TypedDocumentNode } from "@apollo/client";

describe("removeItemRequest", () => {
  const REMOVE_ITEM_REQUEST: TypedDocumentNode<
    RemoveItemRequestMutation,
    RemoveItemRequestMutationVariables
  > = gql`
    mutation RemoveItemRequest($id: ID!) {
      removeItemRequest(id: $id)
    }
  `;

  it("removes the item request", async ({
    completedMovieContext: { completedMovie },
    gqlContext,
    gqlServer,
    services,
  }) => {
    const removeItemRequestSpy = vi.spyOn(
      services.itemRequestService,
      "removeItemRequest",
    );

    await gqlServer.executeOperation(
      {
        query: REMOVE_ITEM_REQUEST,
        variables: {
          id: completedMovie.itemRequest.id,
        },
      },
      { contextValue: gqlContext },
    );

    expect(removeItemRequestSpy).toHaveBeenCalledWith(
      expect.objectContaining({ id: completedMovie.itemRequest.id }),
    );
  });

  describe("when the item is removed successfully", () => {
    it("fires a riven.item-request.removed event", async ({
      completedMovieContext: { completedMovie },
      gqlContext,
      gqlServer,
    }) => {
      const { body } = await gqlServer.executeOperation<
        RemoveItemRequestMutation,
        RemoveItemRequestMutationVariables
      >(
        {
          query: REMOVE_ITEM_REQUEST,
          variables: {
            id: completedMovie.itemRequest.id,
          },
        },
        { contextValue: gqlContext },
      );

      expect.assert(body.kind === "single");

      expect(gqlContext[CoreKey].sendEvent).toHaveBeenCalledWith({
        type: "riven.item-request.removed",
        item: expect.objectContaining({ id: completedMovie.itemRequest.id }),
      });
    });

    it("returns true", async ({
      completedMovieContext: { completedMovie },
      gqlContext,
      gqlServer,
    }) => {
      const { body } = await gqlServer.executeOperation<
        RemoveItemRequestMutation,
        RemoveItemRequestMutationVariables
      >(
        {
          query: REMOVE_ITEM_REQUEST,
          variables: {
            id: completedMovie.itemRequest.id,
          },
        },
        { contextValue: gqlContext },
      );

      expect.assert(body.kind === "single");

      expect(body.singleResult.errors).toBeUndefined();
      expect(body.singleResult.data?.removeItemRequest).toBe(true);
    });
  });

  describe("when the item removal fails", () => {
    it.beforeEach(({ services }) => {
      vi.spyOn(
        services.itemRequestService,
        "removeItemRequest",
      ).mockRejectedValue(new Error("Failed to remove item request"));
    });

    it("does not fire a riven.item-request.removed event", async ({
      completedMovieContext: { completedMovie },
      gqlContext,
      gqlServer,
    }) => {
      const sendEventSpy = vi.mocked(gqlContext[CoreKey].sendEvent);

      const { body } = await gqlServer.executeOperation<
        RemoveItemRequestMutation,
        RemoveItemRequestMutationVariables
      >(
        {
          query: REMOVE_ITEM_REQUEST,
          variables: {
            id: completedMovie.itemRequest.id,
          },
        },
        { contextValue: gqlContext },
      );

      expect.assert(body.kind === "single");

      expect(sendEventSpy).toHaveBeenCalledTimes(0);
    });

    it("returns false", async ({
      completedMovieContext: { completedMovie },
      gqlContext,
      gqlServer,
    }) => {
      const { body } = await gqlServer.executeOperation<
        RemoveItemRequestMutation,
        RemoveItemRequestMutationVariables
      >(
        {
          query: REMOVE_ITEM_REQUEST,
          variables: {
            id: completedMovie.itemRequest.id,
          },
        },
        { contextValue: gqlContext },
      );

      expect.assert(body.kind === "single");

      // Expect(body.singleResult.errors).toBeDefined();
      expect(body.singleResult.data?.removeItemRequest).toBe(false);
    });
  });
});
