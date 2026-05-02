import { ItemRequest } from "@rivenmedia/plugin-sdk/dto/entities";

import { expect, vi } from "vitest";
import { waitFor } from "xstate";

import { it } from "./helpers/test-context.ts";

it.skip('sends a "riven.media-item.index.requested" event for each incomplete item request in the database', async ({
  actor,
  em,
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

  await em.getRepository(ItemRequest).insertMany(items);

  actor.start();

  await waitFor(actor, (state) => state.matches("Running"));

  actor.send({ type: "riven-internal.retry-library" });

  for (const item of items) {
    await vi.waitFor(() => {
      expect(actor).toHaveReceivedEvent({
        type: `riven.media-item.index.requested.${item.type}`,
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

it.todo('requests a scrape for each media item in the "Indexed" state');

it.todo('requests a download for each media item in the "Scraped" state');

it.todo("does not send events for media items in other states");
