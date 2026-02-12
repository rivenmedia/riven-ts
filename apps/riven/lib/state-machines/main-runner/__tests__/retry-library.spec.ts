import { expect, vi } from "vitest";

import { database } from "../../../database/database.ts";
import { it } from "./helpers/test-context.ts";

it('sends a "riven.media-item.index.requested" event for each incomplete item request in the database', async ({
  actor,
}) => {
  const items = [
    database.itemRequest.create({
      imdbId: "tt1234567",
      type: "movie",
      requestedBy: "@repo/plugin-test",
      state: "requested",
    }),
    database.itemRequest.create({
      imdbId: "tt2345678",
      type: "show",
      requestedBy: "@repo/plugin-test",
      state: "requested",
    }),
    database.itemRequest.create({
      imdbId: "tt3456789",
      type: "show",
      requestedBy: "@repo/plugin-test",
      state: "failed",
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
          requestedBy: item.requestedBy,
        }) as never,
      });
    });
  }
});

it.todo(
  'does not send a "riven.media-item.index.requested" event for completed item requests',
);

it.todo('requests a scrape for each media item in the "Indexed" state');

it.todo('requests a download for each media item in the "Scraped" state');

it.todo("does not send events for media items in other states");
