import { expect, vi } from "vitest";

import { database } from "../../../database/database.ts";
import { it } from "./helpers/test-context.ts";

it('sends a "riven.media-item.index.requested" event for each pending RequestedItem in the database with state "Requested"', async ({
  actor,
}) => {
  const items = [
    database.itemRequest.create({
      imdbId: "tt1234567",
      type: "movie",
    }),
    database.itemRequest.create({
      imdbId: "tt2345678",
      type: "show",
    }),
    database.itemRequest.create({
      imdbId: "tt3456789",
      type: "show",
    }),
  ];

  await database.itemRequest.insertMany(items);

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
