import { ItemRequest, MediaItem } from "@repo/util-plugin-sdk/dto/entities";

import { randomUUID } from "node:crypto";
import { expect, vi } from "vitest";

import { it } from "#__tests__/test-context.ts";
import { logger } from "#utilities/logger/logger.ts";

it("processes a movie on its own", async ({
  scrapedMovieContext: { scrapedMovie },
  services: { mediaItemService },
}) => {
  const items = await mediaItemService.getItemsToProcess(scrapedMovie.id);

  expect(items.map(({ id }) => id)).toStrictEqual([scrapedMovie.id]);
});

it("processes a fully requested show on its own when season packs are not preferred", async ({
  overrideRuntimeSettings,
  scrapedShowContext: { scrapedShow },
  services: { mediaItemService },
}) => {
  overrideRuntimeSettings({
    general: { scraping: { preferSeasonPacks: false } },
  });

  const items = await mediaItemService.getItemsToProcess(scrapedShow.id);

  expect(items.map(({ id }) => id)).toStrictEqual([scrapedShow.id]);
});

it("fans a show out into its download items when season packs are preferred", async ({
  overrideRuntimeSettings,
  scrapedShowContext: { scrapedShow },
  services: { downloaderService, mediaItemService },
}) => {
  overrideRuntimeSettings({
    general: { scraping: { preferSeasonPacks: true } },
  });

  const fanOutItems = await downloaderService.getFanOutDownloadItems(
    scrapedShow.id,
  );

  expect(fanOutItems.length).toBeGreaterThan(0);

  const items = await mediaItemService.getItemsToProcess(scrapedShow.id);

  expect(items.map(({ id }) => id)).toStrictEqual(
    fanOutItems.map(({ id }) => id),
  );
  expect(items.map(({ id }) => id)).not.toContain(scrapedShow.id);
});

it.for([
  { label: "a partial request", changes: { isPartialRequest: true } },
  { label: "an ongoing request", changes: { state: "ongoing" } },
] as const)(
  "fans a show out into its download items for $label",
  async (
    { changes },
    {
      em,
      overrideRuntimeSettings,
      scrapedShowContext: { scrapedShow },
      services: { downloaderService, mediaItemService },
    },
  ) => {
    overrideRuntimeSettings({
      general: { scraping: { preferSeasonPacks: false } },
    });

    await em.nativeUpdate(
      ItemRequest,
      { id: scrapedShow.itemRequest.id },
      changes,
    );

    const fanOutItems = await downloaderService.getFanOutDownloadItems(
      scrapedShow.id,
    );

    const items = await mediaItemService.getItemsToProcess(scrapedShow.id);

    expect(items.map(({ id }) => id)).toStrictEqual(
      fanOutItems.map(({ id }) => id),
    );
    expect(items.map(({ id }) => id)).not.toContain(scrapedShow.id);
  },
);

it.for(["failed", "paused"] as const)(
  "does not process a %s item",
  async (
    state,
    {
      em,
      scrapedMovieContext: { scrapedMovie },
      services: { mediaItemService },
    },
  ) => {
    vi.spyOn(logger, "error").mockReturnValue(logger);

    await em.nativeUpdate(MediaItem, { id: scrapedMovie.id }, { state });

    await expect(
      mediaItemService.getItemsToProcess(scrapedMovie.id),
    ).resolves.toStrictEqual([]);
  },
);

it("logs and processes nothing for an unknown item", async ({
  services: { mediaItemService },
}) => {
  const errorSpy = vi.spyOn(logger, "error").mockReturnValue(logger);

  await expect(
    mediaItemService.getItemsToProcess(randomUUID()),
  ).resolves.toStrictEqual([]);

  expect(errorSpy).toHaveBeenCalledWith(
    "Unable to determine media items to process",
    expect.objectContaining({ err: expect.any(Error) }),
  );
});

it.for([
  { preferSeasonPacks: true, expected: ["movie", "season"] },
  { preferSeasonPacks: false, expected: ["movie", "show"] },
])(
  "treats $expected as root item types when season packs are preferred: $preferSeasonPacks",
  (
    { preferSeasonPacks, expected },
    { overrideRuntimeSettings, services: { mediaItemService } },
  ) => {
    overrideRuntimeSettings({ general: { scraping: { preferSeasonPacks } } });

    expect([...mediaItemService.rootItemTypes]).toStrictEqual(expected);
  },
);
