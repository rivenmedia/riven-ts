import { ItemRequest } from "@repo/util-plugin-sdk/dto/entities";
import { ItemRequestCreateErrorConflict } from "@repo/util-plugin-sdk/schemas/events/item-request.create.error.conflict.event";
import { ItemRequestCreateError } from "@repo/util-plugin-sdk/schemas/events/item-request.create.error.event";

import { expect } from "vitest";

import { it } from "../../../__tests__/test-context.ts";
import { persistMovieItemRequest } from "./persist-movie-item-request.ts";

it("returns the item request if processed successfully", async ({ em }) => {
  const requestedId = "tt1234567";

  const result = await persistMovieItemRequest({ imdbId: requestedId }, em);

  expect(result.item).toEqual(
    expect.objectContaining({
      id: 1,
      imdbId: requestedId,
    }),
  );
});

it("sends an error event if the item processing fails", async ({ em }) => {
  const requestedId = "1234";

  await expect(
    persistMovieItemRequest({ imdbId: requestedId }, em),
  ).rejects.toThrow(ItemRequestCreateError);
});

it("saves the external request ID if provided", async ({ em }) => {
  const requestedId = "tt1234568";
  const externalRequestId = "external-req-123";

  const result = await persistMovieItemRequest(
    {
      imdbId: requestedId,
      externalRequestId,
    },
    em,
  );

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

  await persistMovieItemRequest(
    {
      imdbId: requestedId,
      externalRequestId,
    },
    em,
  );

  await expect(
    persistMovieItemRequest(
      {
        imdbId: requestedId,
        externalRequestId,
      },
      em,
    ),
  ).rejects.toThrow(ItemRequestCreateErrorConflict);
});
