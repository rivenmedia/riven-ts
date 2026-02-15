import {
  Episode,
  Movie,
  Season,
  Show,
} from "@repo/util-plugin-sdk/dto/entities";

import { Job, UnrecoverableError } from "bullmq";
import { it as baseIt, expect, vi } from "vitest";

import { database } from "../../../../../database/database.ts";
import * as settingsModule from "../../../../../utilities/settings.ts";
import { createQueue } from "../../../../utilities/create-queue.ts";
import { sortScrapeResultsProcessor } from "./sort-scrape-results.processor.ts";

import type { SortScrapeResultsFlow } from "./sort-scrape-results.schema.ts";

const it = baseIt.extend<{
  movie: Movie;
  show: Show;
  season: Season;
  episode: Episode;
  job: Parameters<SortScrapeResultsFlow["processor"]>[0];
  scrapeResults: Record<string, string>;
}>({
  movie: async ({}, use) => {
    const em = database.em.fork();
    const movie = em.create(Movie, {
      title: "Test Movie",
      contentRating: "g",
      state: "indexed",
    });

    await em.flush();
    await use(movie);
  },
  show: async ({}, use) => {
    const em = database.em.fork();
    const show = em.create(Show, {
      title: "Test Show",
      contentRating: "tv-14",
      state: "indexed",
      status: "ended",
    });

    await em.flush();

    let episodeNumber = 0;

    for (let i = 1; i <= 6; i++) {
      const season = em.create(Season, {
        title: `Season ${i.toString()}`,
        number: i,
        state: "indexed",
      });

      show.seasons.add(season);

      await em.flush();

      for (let i = 1; i <= 10; i++) {
        const episode = em.create(Episode, {
          title: `Episode ${i.toString().padStart(2, "0")}`,
          contentRating: "tv-14",
          number: i,
          absoluteNumber: ++episodeNumber,
          state: "indexed",
        });

        season.episodes.add(episode);
      }

      show.seasons.add(season);
    }

    await em.flush();

    await use(show);
  },
  season: async ({ show }, use) => {
    expect.assert(show.seasons[0]);

    await use(show.seasons[0]);
  },
  episode: async ({ season }, use) => {
    expect.assert(season.episodes[0]);

    await use(season.episodes[0]);
  },
  job: async ({}, use) => {
    const mockQueue = createQueue("mock-queue");
    const job = await Job.create(mockQueue, "mock-sort-scrape-results", {
      id: 1,
      title: "Test media item",
    });

    await use(job);
  },
  scrapeResults: {
    "1234567890123456789012345678901234567890": "Test Movie 2024 1080p WEB-DL",
    "2234567890123456789012345678901234567890": "Test Movie 2024 2160p WEB-DL",
    "3234567890123456789012345678901234567890": "Test Movie 2024 720p WEB-DL",

    // Show torrents
    "4234567890123456789012345678901234567890":
      "Test Show: The Complete Series (Season 1,2,3,4,5&6) E01-60",
    "5234567890123456789012345678901234567890":
      "Test Show: All Seasons (Season 1,2,3,4,5&6) E01-60",

    // Season torrents
    "6234567890123456789012345678901234567890":
      "Test Show 2024 1080p WEB-DL S01",
    "7234567890123456789012345678901234567890":
      "Test Show 2024 1080p WEB-DL S02",

    // Episode torrents
    "8234567890123456789012345678901234567890":
      "Test Show 2024 1080p WEB-DL S01E01",
    "9234567890123456789012345678901234567890":
      "Test Show 2024 1080p WEB-DL S01E02",
    "0234567890123456789012345678901234567890":
      "Test Show 2024 1080p WEB-DL S01E03",
  },
});

it("throws an UnrecoverableError if no results are found", async ({ job }) => {
  vi.spyOn(job, "getChildrenValues").mockResolvedValue({});

  await expect(() => sortScrapeResultsProcessor(job, vi.fn())).rejects.toThrow(
    UnrecoverableError,
  );
});

it("returns valid movie torrents if the item is a movie", async ({
  movie,
  job,
}) => {
  const rawTitles = [
    "Test Movie 2024 1080p WEB-DL",
    "Test Movie 2024 2160p WEB-DL",
    "Test Movie 2024 720p WEB-DL",
  ] as const;

  vi.spyOn(job, "getChildrenValues").mockResolvedValue({
    "plugin[@repo/plugin-test]": {
      id: job.data.id,
      results: {
        "1234567890123456789012345678901234567890": rawTitles[0],
        "2234567890123456789012345678901234567890": rawTitles[1],
        "3234567890123456789012345678901234567890": rawTitles[2],
      },
    },
  });

  await job.updateData({
    id: movie.id,
    title: movie.title,
  });

  const result = await sortScrapeResultsProcessor(job, vi.fn());

  expect.assert(result.success);

  expect(result.result.results).toHaveLength(3);
  expect(result.result.results).toEqual(
    expect.arrayContaining(
      rawTitles.map((title) =>
        expect.objectContaining({
          data: expect.objectContaining({
            rawTitle: title,
          }),
        }),
      ),
    ),
  );
});

it("returns valid show torrents if the item is a show", async ({
  show,
  job,
}) => {
  const rawTitles = [
    "Test Show: The Complete Series (Season 1,2,3,4,5&6) E01-60",
    "Test Show: All Seasons (Season 1,2,3,4,5&6) E01-60",
  ] as const;

  vi.spyOn(job, "getChildrenValues").mockResolvedValue({
    "plugin[@repo/plugin-test]": {
      id: job.data.id,
      results: {
        "4234567890123456789012345678901234567890": rawTitles[0],
        "5234567890123456789012345678901234567890": rawTitles[1],
      },
    },
  });

  await job.updateData({
    id: show.id,
    title: show.title,
  });

  const result = await sortScrapeResultsProcessor(job, vi.fn());

  expect.assert(result.success);

  expect(result.result.results).toHaveLength(2);
  expect(result.result.results).toEqual(
    expect.arrayContaining(
      rawTitles.map((title) =>
        expect.objectContaining({
          data: expect.objectContaining({
            rawTitle: title,
          }),
        }),
      ),
    ),
  );
});

it("returns valid season torrents if the item is a season", async ({
  season,
  job,
}) => {
  const rawTitles = [
    "Test Show 2024 1080p WEB-DL S01 E01-10",
    "Test Show 2024 2160p WEB-DL S01 E01-10",
    "Test Show 2024 720p WEB-DL S01 E01-10",
  ] as const;

  vi.spyOn(job, "getChildrenValues").mockResolvedValue({
    "plugin[@repo/plugin-test]": {
      id: job.data.id,
      results: {
        "4234567890123456789012345678901234567890": rawTitles[0],
        "5234567890123456789012345678901234567890": rawTitles[1],
        "6234567890123456789012345678901234567890": rawTitles[2],
      },
    },
  });

  await job.updateData({
    id: season.id,
    title: await season.getShowTitle(),
  });

  const result = await sortScrapeResultsProcessor(job, vi.fn());

  expect.assert(result.success);

  expect(result.result.results).toHaveLength(3);
  expect(result.result.results).toEqual(
    expect.arrayContaining(
      rawTitles.map((title) =>
        expect.objectContaining({
          data: expect.objectContaining({
            rawTitle: title,
          }),
        }),
      ),
    ),
  );
});

it("returns valid episode torrents if the item is an episode", async ({
  episode,
  job,
}) => {
  const rawTitles = [
    "Test Show 2024 1080p WEB-DL S01E01",
    "Test Show 2024 2160p WEB-DL S01E01",
    "Test Show 2024 720p WEB-DL S01E01",
  ] as const;

  vi.spyOn(job, "getChildrenValues").mockResolvedValue({
    "plugin[@repo/plugin-test]": {
      id: job.data.id,
      results: {
        "4234567890123456789012345678901234567890": rawTitles[0],
        "5234567890123456789012345678901234567890": rawTitles[1],
        "6234567890123456789012345678901234567890": rawTitles[2],
      },
    },
  });

  await job.updateData({
    id: episode.id,
    title: await episode.getShowTitle(),
  });

  const result = await sortScrapeResultsProcessor(job, vi.fn());

  expect.assert(result.success);

  expect(result.result.results).toHaveLength(3);
  expect(result.result.results).toEqual(
    expect.arrayContaining(
      rawTitles.map((title) =>
        expect.objectContaining({
          data: expect.objectContaining({
            rawTitle: title,
          }),
        }),
      ),
    ),
  );
});

it("filters show torrents if the item is a movie", async ({ movie, job }) => {
  const rawTitle = "Test Movie S01E01";

  vi.spyOn(job, "getChildrenValues").mockResolvedValue({
    "plugin[@repo/plugin-test]": {
      id: job.data.id,
      results: {
        "1234567890123456789012345678901234567890": rawTitle,
      },
    },
  });

  await job.updateData({
    id: movie.id,
    title: movie.title,
  });

  const result = await sortScrapeResultsProcessor(job, vi.fn());

  expect.assert(result.success);

  expect(result.result.results).toHaveLength(0);
  expect(result.result.results).not.toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        data: expect.objectContaining({
          rawTitle: rawTitle,
        }),
      }),
    ]),
  );
});

it("filters out torrents with 2 or fewer episodes for shows", async ({
  show,
  job,
}) => {
  const rawTitle = "Test Show: S01E01";

  vi.spyOn(job, "getChildrenValues").mockResolvedValue({
    "plugin[@repo/plugin-test]": {
      id: job.data.id,
      results: {
        "1434567890123456789012345678901234567890": rawTitle,
      },
    },
  });

  await job.updateData({
    id: show.id,
    title: show.title,
  });

  const result = await sortScrapeResultsProcessor(job, vi.fn());

  expect.assert(result.success);

  expect(result.result.results).toHaveLength(0);
  expect(result.result.results).not.toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        data: expect.objectContaining({
          rawTitle,
        }),
      }),
    ]),
  );
});

it("filters out torrents with an incorrect number of seasons for shows", async ({
  show,
  job,
}) => {
  const rawTitle = "Test Show: S01-03 E01-30";

  vi.spyOn(job, "getChildrenValues").mockResolvedValue({
    "plugin[@repo/plugin-test]": {
      id: job.data.id,
      results: {
        "1434567890123456789012345678901234567890": rawTitle,
      },
    },
  });

  await job.updateData({
    id: show.id,
    title: show.title,
  });

  const result = await sortScrapeResultsProcessor(job, vi.fn());

  expect.assert(result.success);

  expect(result.result.results).toHaveLength(0);
  expect(result.result.results).not.toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        data: expect.objectContaining({
          rawTitle,
        }),
      }),
    ]),
  );
});

it("filters out torrents with incorrect number of episodes for single-season shows", async ({
  show,
  job,
}) => {
  const rawTitle = "Test Show: S01 E01-05";

  vi.spyOn(job, "getChildrenValues").mockResolvedValue({
    "plugin[@repo/plugin-test]": {
      id: job.data.id,
      results: {
        "1434567890123456789012345678901234567890": rawTitle,
      },
    },
  });

  const em = database.em.fork();

  const [, ...seasonsToRemove] = show.seasons;

  em.remove(seasonsToRemove);

  await em.flush();

  await job.updateData({
    id: show.id,
    title: show.title,
  });

  const result = await sortScrapeResultsProcessor(job, vi.fn());

  expect.assert(result.success);

  expect(result.result.results).toHaveLength(0);
  expect(result.result.results).not.toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        data: expect.objectContaining({
          rawTitle,
        }),
      }),
    ]),
  );
});

it("filters out duplicate torrents from different plugins", async ({
  movie,
  job,
}) => {
  const rawTitle = "Test Movie: 1080p";

  vi.spyOn(job, "getChildrenValues").mockResolvedValue({
    "plugin[@repo/plugin-test-1]": {
      id: job.data.id,
      results: {
        "1434567890123456789012345678901234567890": rawTitle,
      },
    },
    "plugin[@repo/plugin-test-2]": {
      id: job.data.id,
      results: {
        "1434567890123456789012345678901234567890": rawTitle,
      },
    },
  });

  await job.updateData({
    id: movie.id,
    title: movie.title,
  });

  const result = await sortScrapeResultsProcessor(job, vi.fn());

  expect.assert(result.success);

  expect(result.result.results).toHaveLength(1);
  expect(result.result.results).toEqual([
    expect.objectContaining({
      data: expect.objectContaining({
        rawTitle,
      }),
    }),
  ]);
});

it("filters out torrents with no seasons for season items", async ({
  season,
  job,
}) => {
  const rawTitle = "Test Show 2024 E01-10";

  vi.spyOn(job, "getChildrenValues").mockResolvedValue({
    "plugin[@repo/plugin-test]": {
      id: job.data.id,
      results: {
        "1434567890123456789012345678901234567890": rawTitle,
      },
    },
  });

  await job.updateData({
    id: season.id,
    title: await season.getShowTitle(),
  });

  const result = await sortScrapeResultsProcessor(job, vi.fn());

  expect.assert(result.success);

  expect(result.result.results).toHaveLength(0);
  expect(result.result.results).not.toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        data: expect.objectContaining({
          rawTitle,
        }),
      }),
    ]),
  );
});

it("filters out torrents with the incorrect season number for season items", async ({
  season,
  job,
}) => {
  const rawTitle = "Test Show 2024 S02 E01-10";

  vi.spyOn(job, "getChildrenValues").mockResolvedValue({
    "plugin[@repo/plugin-test]": {
      id: job.data.id,
      results: {
        "1434567890123456789012345678901234567890": rawTitle,
      },
    },
  });

  await job.updateData({
    id: season.id,
    title: await season.getShowTitle(),
  });

  const result = await sortScrapeResultsProcessor(job, vi.fn());

  expect.assert(result.success);

  expect(result.result.results).toHaveLength(0);
  expect(result.result.results).not.toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        data: expect.objectContaining({
          rawTitle,
        }),
      }),
    ]),
  );
});

it("filters out torrents with 2 or fewer episodes for season items", async ({
  season,
  job,
}) => {
  const rawTitle = "Test Show 2024 S01 E01";

  vi.spyOn(job, "getChildrenValues").mockResolvedValue({
    "plugin[@repo/plugin-test]": {
      id: job.data.id,
      results: {
        "1434567890123456789012345678901234567890": rawTitle,
      },
    },
  });

  await job.updateData({
    id: season.id,
    title: await season.getShowTitle(),
  });

  const result = await sortScrapeResultsProcessor(job, vi.fn());

  expect.assert(result.success);

  expect(result.result.results).toHaveLength(0);
  expect(result.result.results).not.toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        data: expect.objectContaining({
          rawTitle,
        }),
      }),
    ]),
  );
});

it("filters out torrents with incorrect episodes for season items", async ({
  season,
  job,
}) => {
  const rawTitle = "Test Show 2024 S01 E30-50";

  vi.spyOn(job, "getChildrenValues").mockResolvedValue({
    "plugin[@repo/plugin-test]": {
      id: job.data.id,
      results: {
        "1434567890123456789012345678901234567890": rawTitle,
      },
    },
  });

  await job.updateData({
    id: season.id,
    title: await season.getShowTitle(),
  });

  const result = await sortScrapeResultsProcessor(job, vi.fn());

  expect.assert(result.success);

  expect(result.result.results).toHaveLength(0);
  expect(result.result.results).not.toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        data: expect.objectContaining({
          rawTitle,
        }),
      }),
    ]),
  );
});

it("filters out torrents with incorrect episode numbers for episode items", async ({
  episode,
  job,
}) => {
  const rawTitle = "Test Show 2024 S01E02";

  vi.spyOn(job, "getChildrenValues").mockResolvedValue({
    "plugin[@repo/plugin-test]": {
      id: job.data.id,
      results: {
        "1434567890123456789012345678901234567890": rawTitle,
      },
    },
  });

  await job.updateData({
    id: episode.id,
    title: await episode.getShowTitle(),
  });

  const result = await sortScrapeResultsProcessor(job, vi.fn());

  expect.assert(result.success);

  expect(result.result.results).toHaveLength(0);
  expect(result.result.results).not.toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        data: expect.objectContaining({
          rawTitle,
        }),
      }),
    ]),
  );
});

it("filters out torrents with the incorrect season number for episode items", async ({
  episode,
  job,
}) => {
  const rawTitle = "Test Show 2024 S02E01";

  vi.spyOn(job, "getChildrenValues").mockResolvedValue({
    "plugin[@repo/plugin-test]": {
      id: job.data.id,
      results: {
        "1434567890123456789012345678901234567890": rawTitle,
      },
    },
  });

  await job.updateData({
    id: episode.id,
    title: await episode.getShowTitle(),
  });

  const result = await sortScrapeResultsProcessor(job, vi.fn());

  expect.assert(result.success);

  expect(result.result.results).toHaveLength(0);
  expect(result.result.results).not.toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        data: expect.objectContaining({
          rawTitle,
        }),
      }),
    ]),
  );
});

it("filters out torrents with no episodes for episode items", async ({
  episode,
  job,
}) => {
  const rawTitle = "Test Show 2024";

  vi.spyOn(job, "getChildrenValues").mockResolvedValue({
    "plugin[@repo/plugin-test]": {
      id: job.data.id,
      results: {
        "1434567890123456789012345678901234567890": rawTitle,
      },
    },
  });

  await job.updateData({
    id: episode.id,
    title: await episode.getShowTitle(),
  });

  const result = await sortScrapeResultsProcessor(job, vi.fn());

  expect.assert(result.success);

  expect(result.result.results).not.toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        data: expect.objectContaining({
          rawTitle,
        }),
      }),
    ]),
  );
});

it("filters out torrents that do not match the media item's country", async ({
  episode,
  job,
}) => {
  const rawTitle = "Test Show 2024 S01E01 [US]";

  const em = database.em.fork();

  em.persist(episode);
  em.assign(episode, { country: "UK" });

  await em.flush();

  vi.spyOn(job, "getChildrenValues").mockResolvedValue({
    "plugin[@repo/plugin-test]": {
      id: job.data.id,
      results: {
        "1434567890123456789012345678901234567890": rawTitle,
      },
    },
  });

  await job.updateData({
    id: episode.id,
    title: await episode.getShowTitle(),
  });

  const result = await sortScrapeResultsProcessor(job, vi.fn());

  expect.assert(result.success);

  expect(result.result.results).toHaveLength(0);
  expect(result.result.results).not.toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        data: expect.objectContaining({
          rawTitle,
        }),
      }),
    ]),
  );
});

it("does not filter out torrents that do not match the media item's country if the media item is anime", async ({
  episode,
  job,
}) => {
  const rawTitle = "Test Show 2024 S01E01 [US]";

  const em = database.em.fork();

  em.persist(episode);
  em.assign(episode, {
    country: "UK",
    language: "jp",
    genres: ["animation", "anime"],
  });

  await em.flush();

  vi.spyOn(job, "getChildrenValues").mockResolvedValue({
    "plugin[@repo/plugin-test]": {
      id: job.data.id,
      results: {
        "1434567890123456789012345678901234567890": rawTitle,
      },
    },
  });

  await job.updateData({
    id: episode.id,
    title: await episode.getShowTitle(),
  });

  const result = await sortScrapeResultsProcessor(job, vi.fn());

  expect.assert(result.success);

  expect(result.result.results).toHaveLength(1);
  expect(result.result.results).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        data: expect.objectContaining({
          rawTitle,
        }),
      }),
    ]),
  );
});

it("filters out torrents that do not match the media item's year ± 1 year", async ({
  movie,
  job,
}) => {
  const rawTitles = [
    "Test Movie 2018 1080p",
    "Test Movie 2019 1080p",
    "Test Movie 2020 1080p",
    "Test Movie 2021 1080p",
    "Test Movie 2022 1080p",
  ] as const;

  const em = database.em.fork();

  em.persist(movie);
  em.assign(movie, {
    year: 2020,
  });

  await em.flush();

  vi.spyOn(job, "getChildrenValues").mockResolvedValue({
    "plugin[@repo/plugin-test]": {
      id: job.data.id,
      results: {
        "1434567890123456789012345678901234567890": rawTitles[0],
        "1434567890123456789012345678901234567891": rawTitles[1],
        "1434567890123456789012345678901234567892": rawTitles[2],
        "1434567890123456789012345678901234567893": rawTitles[3],
        "1434567890123456789012345678901234567894": rawTitles[4],
      },
    },
  });

  await job.updateData({
    id: movie.id,
    title: movie.title,
  });

  const result = await sortScrapeResultsProcessor(job, vi.fn());

  expect.assert(result.success);

  expect(result.result.results).toHaveLength(3);
  expect(result.result.results).toEqual(
    expect.arrayContaining(
      rawTitles.slice(1, 4).map((rawTitle) =>
        expect.objectContaining({
          data: expect.objectContaining({
            rawTitle,
          }),
        }),
      ),
    ),
  );
});

it('filters out torrents that are not dubbed if the media item is anime and the "dubbed anime only" setting is enabled', async ({
  movie,
  job,
}) => {
  const rawTitles = [
    "Test Movie 2018 1080p [Dubbed]",
    "Test Movie 2022 1080p",
  ] as const;

  const em = database.em.fork();

  em.persist(movie);
  em.assign(movie, {
    language: "jp",
    genres: ["animation", "anime"],
  });

  await em.flush();

  vi.spyOn(job, "getChildrenValues").mockResolvedValue({
    "plugin[@repo/plugin-test]": {
      id: job.data.id,
      results: {
        "1434567890123456789012345678901234567890": rawTitles[0],
        "1434567890123456789012345678901234567891": rawTitles[1],
      },
    },
  });

  vi.spyOn(settingsModule, "settings", "get").mockReturnValue({
    ...settingsModule.settings,
    dubbedAnimeOnly: true,
  });

  await job.updateData({
    id: movie.id,
    title: movie.title,
  });

  const result = await sortScrapeResultsProcessor(job, vi.fn());

  expect.assert(result.success);

  expect(result.result.results).toHaveLength(1);
  expect(result.result.results).toEqual([
    expect.objectContaining({
      data: expect.objectContaining({
        rawTitle: rawTitles[0],
      }),
    }),
  ]);
});

it('does not filter out torrents that are not dubbed if the media item is anime and the "dubbed anime only" setting is disabled', async ({
  movie,
  job,
}) => {
  const rawTitles = [
    "Test Movie 2018 1080p [Dubbed]",
    "Test Movie 2022 1080p",
  ] as const;

  const em = database.em.fork();

  em.persist(movie);
  em.assign(movie, {
    language: "jp",
    genres: ["animation", "anime"],
  });

  await em.flush();

  vi.spyOn(job, "getChildrenValues").mockResolvedValue({
    "plugin[@repo/plugin-test]": {
      id: job.data.id,
      results: {
        "1434567890123456789012345678901234567890": rawTitles[0],
        "1434567890123456789012345678901234567891": rawTitles[1],
      },
    },
  });

  vi.spyOn(settingsModule, "settings", "get").mockReturnValue({
    ...settingsModule.settings,
    dubbedAnimeOnly: false,
  });

  await job.updateData({
    id: movie.id,
    title: movie.title,
  });

  const result = await sortScrapeResultsProcessor(job, vi.fn());

  expect.assert(result.success);

  expect(result.result.results).toHaveLength(2);
  expect(result.result.results).toEqual(
    expect.arrayContaining(
      rawTitles.map((rawTitle) =>
        expect.objectContaining({
          data: expect.objectContaining({
            rawTitle,
          }),
        }),
      ),
    ),
  );
});

it("returns sorted results", async ({ movie, job }) => {
  const rawTitles = [
    "Test Movie 2024 2160p",
    "Test Movie 2024 720p WEB-DL",
    "Test Movie 2024 1080p HDR10+ 5.1",
  ] as const;

  vi.spyOn(job, "getChildrenValues").mockResolvedValue({
    "plugin[@repo/plugin-test]": {
      id: job.data.id,
      results: {
        "1434567890123456789012345678901234567890": rawTitles[0],
        "1434567890123456789012345678901234567891": rawTitles[1],
        "1434567890123456789012345678901234567892": rawTitles[2],
      },
    },
  });

  await job.updateData({
    id: movie.id,
    title: movie.title,
  });

  const result = await sortScrapeResultsProcessor(job, vi.fn());

  expect.assert(result.success);

  const expectedOrder = [rawTitles[2], rawTitles[0], rawTitles[1]] as const;

  expect(result.result.results).toHaveLength(3);
  expect(result.result.results).toEqual(
    expectedOrder.map((rawTitle) =>
      expect.objectContaining({
        data: expect.objectContaining({
          rawTitle,
        }),
      }),
    ),
  );
});
