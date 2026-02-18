import { ItemRequest, Movie } from "@repo/util-plugin-sdk/dto/entities";
import { MediaItemIndexError } from "@repo/util-plugin-sdk/schemas/events/media-item.index.error.event";

import { expect, it } from "vitest";

import { database } from "../../../../database/database.ts";
import { persistShowIndexerData } from "./persist-show-indexer-data.ts";

it("returns the media item if processed successfully", async ({}) => {
  const requestedId = "tt1234567";

  const em = database.orm.em.fork();
  const itemRequest = em.create(ItemRequest, {
    requestedBy: "test-user",
    imdbId: requestedId,
    tvdbId: "1234",
    type: "show",
    state: "requested",
  });

  await em.flush();

  const result = await persistShowIndexerData({
    item: {
      id: itemRequest.id,
      title: "Test Show",
      imdbId: requestedId,
      contentRating: "tv-14",
      genres: [],
      type: "show",
      firstAired: new Date("2020-01-01").toISOString(),
      network: "Test Network",
      seasons: [],
      status: "ended",
    },
  });

  expect(result).instanceOf(Movie);
  expect(result).toEqual(
    expect.objectContaining({
      id: 1,
      title: "Test Show",
      type: "show",
    }),
  );
});

it("throws an error if the item processing fails", async () => {
  const requestedId = "1234";

  await expect(
    persistShowIndexerData({
      item: {
        id: 1,
        title: "Test Show",
        imdbId: requestedId,
        contentRating: "tv-14",
        genres: [],
        type: "show",
        firstAired: new Date("2020-01-01").toISOString(),
        network: "Test Network",
        seasons: [],
        status: "ended",
      },
    }),
  ).rejects.toThrow(MediaItemIndexError);
});
