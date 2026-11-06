import { gql } from "@apollo/client";
import { expect, vi } from "vitest";

import { it } from "#__tests__/test-context.ts";
import { CoreKey } from "#graphql/context.ts";
import { createQueue } from "#message-queue/utilities/create-queue.ts";

import type {
  ItemRequestResolverSpecRemoveItemRequestMutation,
  ItemRequestResolverSpecRemoveItemRequestMutationVariables,
} from "./remove-item-request.spec.typegen.ts";
import type { TypedDocumentNode } from "@apollo/client";

const REMOVE_ITEM_REQUEST: TypedDocumentNode<
  ItemRequestResolverSpecRemoveItemRequestMutation,
  ItemRequestResolverSpecRemoveItemRequestMutationVariables
> = gql`
  mutation ItemRequestResolverSpecRemoveItemRequest($itemRequestId: ID!) {
    removeItemRequest(itemRequestId: $itemRequestId)
  }
`;

it.beforeEach(() => {
  createQueue("process-item-request");
  createQueue("process-media-item");
});

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
        itemRequestId: completedMovie.itemRequest.id,
      },
    },
    { contextValue: gqlContext },
  );

  expect(removeItemRequestSpy).toHaveBeenCalledWith(
    expect.objectContaining({ id: completedMovie.itemRequest.id }),
  );
});

it('removes the item\'s reindex job from the "process-item-request" queue', async ({
  completedMovieContext: { completedMovie },
  gqlContext,
  gqlServer,
}) => {
  const processItemRequestQueue = createQueue("process-item-request");

  const reindexJob = await processItemRequestQueue.add(
    "Process item request",
    {},
    {
      deduplication: {
        id: `reindex-item-${completedMovie.itemRequest.id}`,
      },
    },
  );

  expect.assert(reindexJob.id);

  const { body } = await gqlServer.executeOperation<
    ItemRequestResolverSpecRemoveItemRequestMutation,
    ItemRequestResolverSpecRemoveItemRequestMutationVariables
  >(
    {
      query: REMOVE_ITEM_REQUEST,
      variables: {
        itemRequestId: completedMovie.itemRequest.id,
      },
    },
    { contextValue: gqlContext },
  );

  expect.assert(body.kind === "single");

  await expect(
    processItemRequestQueue.getJob(reindexJob.id),
  ).resolves.toBeUndefined();
});

it('removes all processing jobs from the "process-media-item" queue for the item request\'s media items when the item request is for a show', async ({
  completedShowContext: { completedShow, episodes, seasons },
  gqlContext,
  gqlServer,
}) => {
  const processMediaItemQueue = createQueue("process-media-item");

  const mediaItems = await completedShow.itemRequest.loadProperty("mediaItems");

  const jobIds = new Set<string>();

  for (const item of await mediaItems.loadItems()) {
    const job = await processMediaItemQueue.add(
      "Process media item",
      {},
      {
        deduplication: {
          id: `process-${item.type}-${item.id}`,
        },
      },
    );

    expect.assert(job.id);

    jobIds.add(job.id);
  }

  const { body } = await gqlServer.executeOperation<
    ItemRequestResolverSpecRemoveItemRequestMutation,
    ItemRequestResolverSpecRemoveItemRequestMutationVariables
  >(
    {
      query: REMOVE_ITEM_REQUEST,
      variables: {
        itemRequestId: completedShow.itemRequest.id,
      },
    },
    { contextValue: gqlContext },
  );

  expect.assert(body.kind === "single");

  for (const jobId of jobIds) {
    await expect(processMediaItemQueue.getJob(jobId)).resolves.toBeUndefined();
  }

  const totalMediaItems = 1 + seasons.length + episodes.length;

  expect.assertions(totalMediaItems);
});

it('removes all processing jobs from the "process-media-item" queue for the item request\'s media items when the item request is for a movie', async ({
  completedMovieContext: { completedMovie },
  gqlContext,
  gqlServer,
}) => {
  const processMediaItemQueue = createQueue("process-media-item");

  const mediaItems =
    await completedMovie.itemRequest.loadProperty("mediaItems");

  const jobIds = new Set<string>();

  for (const item of await mediaItems.loadItems()) {
    const job = await processMediaItemQueue.add(
      "Process media item",
      {},
      {
        deduplication: {
          id: `process-${item.type}-${item.id}`,
        },
      },
    );

    expect.assert(job.id);

    jobIds.add(job.id);
  }

  const { body } = await gqlServer.executeOperation<
    ItemRequestResolverSpecRemoveItemRequestMutation,
    ItemRequestResolverSpecRemoveItemRequestMutationVariables
  >(
    {
      query: REMOVE_ITEM_REQUEST,
      variables: {
        itemRequestId: completedMovie.itemRequest.id,
      },
    },
    { contextValue: gqlContext },
  );

  expect.assert(body.kind === "single");

  for (const jobId of jobIds) {
    await expect(processMediaItemQueue.getJob(jobId)).resolves.toBeUndefined();
  }

  expect.assertions(1);
});

it("fires a riven.item-request.removed event", async ({
  completedMovieContext: { completedMovie },
  gqlContext,
  gqlServer,
}) => {
  const { body } = await gqlServer.executeOperation<
    ItemRequestResolverSpecRemoveItemRequestMutation,
    ItemRequestResolverSpecRemoveItemRequestMutationVariables
  >(
    {
      query: REMOVE_ITEM_REQUEST,
      variables: {
        itemRequestId: completedMovie.itemRequest.id,
      },
    },
    { contextValue: gqlContext },
  );

  expect.assert(body.kind === "single");

  expect(gqlContext[CoreKey].sendEvent).toHaveBeenCalledWith({
    type: "riven.item-request.removed",
    item: expect.objectContaining({ id: completedMovie.itemRequest.id }),
    title: completedMovie.title,
  });
});

it("returns true", async ({
  completedMovieContext: { completedMovie },
  gqlContext,
  gqlServer,
}) => {
  const { body } = await gqlServer.executeOperation<
    ItemRequestResolverSpecRemoveItemRequestMutation,
    ItemRequestResolverSpecRemoveItemRequestMutationVariables
  >(
    {
      query: REMOVE_ITEM_REQUEST,
      variables: {
        itemRequestId: completedMovie.itemRequest.id,
      },
    },
    { contextValue: gqlContext },
  );

  expect.assert(body.kind === "single");

  expect(body.singleResult.errors).toBeUndefined();
  expect(body.singleResult.data?.removeItemRequest).toBe(true);
});

it("does not fire a riven.item-request.removed event when the removal fails", async ({
  completedMovieContext: { completedMovie },
  gqlContext,
  gqlServer,
  services,
}) => {
  vi.spyOn(services.itemRequestService, "removeItemRequest").mockRejectedValue(
    new Error("Failed to remove item request"),
  );

  const sendEventSpy = vi.mocked(gqlContext[CoreKey].sendEvent);

  const { body } = await gqlServer.executeOperation<
    ItemRequestResolverSpecRemoveItemRequestMutation,
    ItemRequestResolverSpecRemoveItemRequestMutationVariables
  >(
    {
      query: REMOVE_ITEM_REQUEST,
      variables: {
        itemRequestId: completedMovie.itemRequest.id,
      },
    },
    { contextValue: gqlContext },
  );

  expect.assert(body.kind === "single");

  expect(sendEventSpy).toHaveBeenCalledTimes(0);
});

it("throws the error when the removal fails", async ({
  completedMovieContext: { completedMovie },
  gqlContext,
  gqlServer,
  services,
}) => {
  vi.spyOn(services.itemRequestService, "removeItemRequest").mockRejectedValue(
    new Error("Failed to remove item request"),
  );

  const { body } = await gqlServer.executeOperation<
    ItemRequestResolverSpecRemoveItemRequestMutation,
    ItemRequestResolverSpecRemoveItemRequestMutationVariables
  >(
    {
      query: REMOVE_ITEM_REQUEST,
      variables: {
        itemRequestId: completedMovie.itemRequest.id,
      },
    },
    { contextValue: gqlContext },
  );

  expect.assert(body.kind === "single");

  expect(body.singleResult.errors?.[0]?.message).toBe(
    "Failed to remove item request",
  );
});
