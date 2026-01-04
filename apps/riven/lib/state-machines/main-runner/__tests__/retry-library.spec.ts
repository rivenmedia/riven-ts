import { database } from "@repo/core-util-database/connection";
import { MediaItem } from "@repo/util-plugin-sdk/dto/entities/index";

import { expect, vi } from "vitest";

import { it } from "./helpers/test-context.ts";

it('sends a "riven.media-item.creation.success" event for each pending MediaItem in the database with state "Requested"', async ({
  actor,
}) => {
  await database.manager.insert(MediaItem, [
    {
      imdbId: "tt1234567",
      state: "Requested",
    },
    {
      imdbId: "tt2345678",
      state: "Requested",
    },
    {
      imdbId: "tt3456789",
      state: "Requested",
    },
  ]);

  actor.start();

  await vi.waitFor(() => {
    expect(actor).toHaveReceivedEvent({
      type: "riven.media-item.creation.success",
      item: expect.objectContaining<Partial<MediaItem>>({
        imdbId: "tt1234567",
      }) as never,
    });
  });
});
