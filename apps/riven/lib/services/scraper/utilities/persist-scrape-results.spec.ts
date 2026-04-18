import { MediaItem } from "@repo/util-plugin-sdk/dto/entities";
import { MediaItemScrapeErrorIncorrectState } from "@repo/util-plugin-sdk/schemas/events/media-item.scrape.error.incorrect-state.event";
import { parse } from "@repo/util-rank-torrent-name";

import { faker } from "@faker-js/faker";
import { DateTime } from "luxon";
import { expect, vi } from "vitest";

import { it } from "../../../__tests__/test-context.ts";

it("returns the updated item if persisting the scrape results is successful", async ({
  seeders: { seedIndexedMovie },
  services,
}) => {
  const indexedMovie = await seedIndexedMovie();

  const { item, newStreamsCount } = await services.scraperService.scrapeItem(
    indexedMovie.movie.id,
    {
      [faker.git.commitSha()]: parse("Some.Movie.2024.1080p.WEBRip.x264-GROUP"),
    },
  );

  expect(newStreamsCount).toEqual(1);

  expect(item).toBeInstanceOf(MediaItem);
  expect(item).toEqual(
    expect.objectContaining({
      id: indexedMovie.movie.id,
    }),
  );

  expect(item.streams.count()).toEqual(indexedMovie.movie.streams.count() + 1);
});

it('throws a MediaItemScrapeErrorIncorrectState error if the item is not in the "indexed" state', async ({
  seeders: { seedCompletedMovie },
  services,
}) => {
  const completedMovie = await seedCompletedMovie();

  await expect(() =>
    services.scraperService.scrapeItem(completedMovie.movie.id, {
      [faker.git.commitSha()]: parse("Some.Movie.2024.1080p.WEBRip.x264-GROUP"),
    }),
  ).rejects.toThrow(MediaItemScrapeErrorIncorrectState);
});

it.todo(
  "throws a MediaItemScrapeError error if a validation error occurs whilst persisting the scrape results",
);

it("updates the scrape metadata when re-scraping a failed item", async ({
  seeders: { seedScrapedMovie },
  services,
}) => {
  const scrapedMovie = await seedScrapedMovie();
  const now = DateTime.now().plus({ days: 1 }).toJSDate();

  vi.setSystemTime(now);

  const { item } = await services.scraperService.scrapeItem(
    scrapedMovie.movie.id,
    {},
  );

  expect(item.scrapedTimes).toEqual(scrapedMovie.movie.scrapedTimes + 1);
  expect(item.scrapedAt).toEqual(now);
});

it("increases the failed attempts count when no new streams are added", async ({
  seeders: { seedScrapedMovie },
  services,
}) => {
  const scrapedMovie = await seedScrapedMovie();

  const { item } = await services.scraperService.scrapeItem(
    scrapedMovie.movie.id,
    Object.fromEntries(
      scrapedMovie.streams.map((stream) => [
        stream.infoHash,
        stream.parsedData,
      ]),
    ),
  );

  expect(item.failedAttempts).toEqual(scrapedMovie.movie.failedAttempts + 1);
});

it("resets the failed attempts count when new streams are added", async ({
  seeders: { seedIndexedMovie },
  services,
  em,
}) => {
  const indexedMovie = await seedIndexedMovie();

  em.assign(indexedMovie.movie, {
    failedAttempts: 2,
    scrapedTimes: 2,
  });

  const { item, newStreamsCount } = await services.scraperService.scrapeItem(
    indexedMovie.movie.id,
    {
      [faker.git.commitSha()]: parse("Some.Movie.2024.1080p.WEBRip.x264-GROUP"),
    },
  );

  expect(newStreamsCount).toEqual(1);
  expect(item.failedAttempts).toEqual(0);
});
