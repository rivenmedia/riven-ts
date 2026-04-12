import { ItemRequest } from "@repo/util-plugin-sdk/dto/entities";
import { ItemRequestCreateErrorConflict } from "@repo/util-plugin-sdk/schemas/events/item-request.create.error.conflict.event";
import { ItemRequestCreateError } from "@repo/util-plugin-sdk/schemas/events/item-request.create.error.event";

import { expect } from "vitest";

import { it } from "../../../../__tests__/test-context.ts";
import { requestMovieMutation } from "./request-movie.mutation.ts";

it("returns the item request if processed successfully", async ({ em }) => {
  const requestedId = "tt1234567";

  const result = await requestMovieMutation(em, {
    imdbId: requestedId,
  });

  expect(result.item).toEqual(
    expect.objectContaining({
      imdbId: requestedId,
    }),
  );
});

it("sends an error event if the item processing fails", async ({ em }) => {
  const requestedId = "1234";

  await expect(
    requestMovieMutation(em, {
      imdbId: requestedId,
    }),
  ).rejects.toThrow(ItemRequestCreateError);
});

it("saves the external request ID if provided", async ({ em }) => {
  const requestedId = "tt1234568";
  const externalRequestId = "external-req-123";

  const result = await requestMovieMutation(em, {
    imdbId: requestedId,
    externalRequestId,
  });

  expect(result.item).toEqual(
    expect.objectContaining<Partial<ItemRequest>>({
      externalRequestId,
    }),
  );
});

it("throws an ItemRequestCreateErrorConflict error if the item request already exists", async ({
  em,
}) => {
  const requestedId = "tt1234568";
  const externalRequestId = "external-req-123";

  await requestMovieMutation(em, {
    imdbId: requestedId,
    externalRequestId,
  });

  await expect(
    requestMovieMutation(em, {
      imdbId: requestedId,
      externalRequestId,
    }),
  ).rejects.toThrow(ItemRequestCreateErrorConflict);
});
