import { expect, vi } from "vitest";
import { waitFor } from "xstate";

import { database } from "../../../database/database.ts";
import { it } from "./helpers/test-context.ts";

it('sends a "riven.media-item.index.requested" event for each incomplete item request in the database', async ({
  actor,
  factories: { showItemRequestFactory, movieItemRequestFactory },
}) => {
  const items = [
    movieItemRequestFactory.makeEntity({
      imdbId: "tt1234567",
      state: "requested",
    }),
    showItemRequestFactory.makeEntity({
      imdbId: "tt2345678",
      state: "requested",
    }),
    showItemRequestFactory.makeEntity({
      imdbId: "tt3456789",
      state: "failed",
    }),
  ];

  await database.itemRequest.insertMany(items);

  actor.start();

  await waitFor(actor, (state) => state.matches("Running"));

  actor.send({ type: "riven-internal.retry-library" });

  for (const item of items) {
    await vi.waitFor(() => {
      expect(actor).toHaveReceivedEvent({
        type: "riven.media-item.index.requested",
        item: expect.objectContaining({
          id: item.id,
          imdbId: item.imdbId,
          requestedBy: item.requestedBy,
        }),
      });
    });
  }
});

it.todo(
  'does not send a "riven.media-item.index.requested" event for completed item requests',
);

it.todo('requests a scrape for each media item in the "indexed" state');

it.todo('requests a download for each media item in the "scraped" state');

it.todo("does not send events for media items in other states");
