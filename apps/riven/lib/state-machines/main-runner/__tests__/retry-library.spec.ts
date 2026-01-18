import { database } from "@repo/core-util-database/database";
import { RequestedItem } from "@repo/util-plugin-sdk/dto/entities/index";

import { expect, vi } from "vitest";

import { it } from "./helpers/test-context.ts";

it('sends a "riven.media-item.index.requested" event for each pending RequestedItem in the database with state "Requested"', async ({
  actor,
}) => {
  const items = [
    RequestedItem.create({
      imdbId: "tt1234567",
      state: "Requested",
    }),
    RequestedItem.create({
      imdbId: "tt2345678",
      state: "Requested",
    }),
    RequestedItem.create({
      imdbId: "tt3456789",
      state: "Requested",
    }),
  ];

  await database.mediaItem.insertMany(items);

  actor.start();

  for (const item of items) {
    await vi.waitFor(() => {
      expect(actor).toHaveReceivedEvent({
        type: "riven.media-item.index.requested",
        item: expect.objectContaining({
          id: item.id,
          imdbId: item.imdbId,
        }) as never,
      });
    });
  }
});
