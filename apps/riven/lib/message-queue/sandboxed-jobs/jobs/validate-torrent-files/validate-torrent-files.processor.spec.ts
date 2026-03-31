import { UnrecoverableError } from "bullmq";
import { expect, vi } from "vitest";

import { it as baseIt } from "../../../../__tests__/test-context.ts";
import * as settingsModule from "../../../../utilities/settings.ts";
import parseScrapeResultsProcessor from "./validate-torrent-files.processor.ts";

const it = baseIt.extend("scrapeResults", {
  "1234567890123456789012345678901234567890": "Test Movie 2024 1080p WEB-DL",
  "2234567890123456789012345678901234567890": "Test Movie 2024 2160p WEB-DL",
  "3234567890123456789012345678901234567890": "Test Movie 2024 720p WEB-DL",

  // Show torrents
  "4234567890123456789012345678901234567890":
    "Test Show: The Complete Series (Season 1,2,3,4,5&6) E01-60",
  "5234567890123456789012345678901234567890":
    "Test Show: All Seasons (Season 1,2,3,4,5&6) E01-60",

  // Season torrents
  "6234567890123456789012345678901234567890": "Test Show 2024 1080p WEB-DL S01",
  "7234567890123456789012345678901234567890": "Test Show 2024 1080p WEB-DL S02",

  // Episode torrents
  "8234567890123456789012345678901234567890":
    "Test Show 2024 1080p WEB-DL S01E01",
  "9234567890123456789012345678901234567890":
    "Test Show 2024 1080p WEB-DL S01E02",
  "0234567890123456789012345678901234567890":
    "Test Show 2024 1080p WEB-DL S01E03",
});

it("throws an UnrecoverableError if no results are found", async ({
  createMockJob,
  indexedMovieContext: { indexedMovie },
  mockSentryScope,
}) => {
  const job = await createMockJob({ id: indexedMovie.id });

  vi.spyOn(job, "getChildrenValues").mockResolvedValue({});

  await expect(() =>
    parseScrapeResultsProcessor({ job, scope: mockSentryScope }, vi.fn()),
  ).rejects.toThrow(UnrecoverableError);
});

it("returns valid movie torrents if the item is a movie", async ({
  indexedMovieContext: { indexedMovie },
  createMockJob,
  mockSentryScope,
}) => {
  const rawTitles = [
    "Test Movie 2024 1080p WEB-DL",
    "Test Movie 2024 2160p WEB-DL",
    "Test Movie 2024 720p WEB-DL",
  ] as const;

  const job = await createMockJob({ id: indexedMovie.id });

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

  const { results } = await parseScrapeResultsProcessor(
    { job, scope: mockSentryScope },
    vi.fn(),
  );

  expect(Object.keys(results)).toHaveLength(3);
  expect(Object.values(results)).toEqual(
    expect.arrayContaining(
      rawTitles.map((title) =>
        expect.objectContaining({
          rawTitle: title,
        }),
      ),
    ),
  );
});

it("returns valid show torrents if the item is a show", async ({
  indexedShowContext: { indexedShow },
  createMockJob,
  mockSentryScope,
}) => {
  const rawTitles = [
    "Test Show: The Complete Series (Season 1,2,3,4,5&6) E01-60",
    "Test Show: All Seasons (Season 1,2,3,4,5&6) E01-60",
  ] as const;

  const job = await createMockJob({ id: indexedShow.id });

  vi.spyOn(job, "getChildrenValues").mockResolvedValue({
    "plugin[@repo/plugin-test]": {
      id: job.data.id,
      results: {
        "4234567890123456789012345678901234567890": rawTitles[0],
        "5234567890123456789012345678901234567890": rawTitles[1],
      },
    },
  });

  const { results } = await parseScrapeResultsProcessor(
    { job, scope: mockSentryScope },
    vi.fn(),
  );

  expect(Object.keys(results)).toHaveLength(2);
  expect(Object.values(results)).toEqual(
    expect.arrayContaining(
      rawTitles.map((title) =>
        expect.objectContaining({
          rawTitle: title,
        }),
      ),
    ),
  );
});

it("returns valid season torrents if the item is a season", async ({
  season,
  createMockJob,
  mockSentryScope,
}) => {
  const rawTitles = [
    "Test Show 2024 1080p WEB-DL S01 E01-10",
    "Test Show 2024 2160p WEB-DL S01 E01-10",
    "Test Show 2024 720p WEB-DL S01 E01-10",
  ] as const;

  const job = await createMockJob({ id: season.id });

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

  const { results } = await parseScrapeResultsProcessor(
    { job, scope: mockSentryScope },
    vi.fn(),
  );

  expect(Object.keys(results)).toHaveLength(3);
  expect(Object.values(results)).toEqual(
    expect.arrayContaining(
      rawTitles.map((title) =>
        expect.objectContaining({
          rawTitle: title,
        }),
      ),
    ),
  );
});

it("returns valid episode torrents if the item is an episode", async ({
  episode,
  createMockJob,
  mockSentryScope,
}) => {
  const rawTitles = [
    "Test Show 2024 1080p WEB-DL S01E01",
    "Test Show 2024 2160p WEB-DL S01E01",
    "Test Show 2024 720p WEB-DL S01E01",
  ] as const;

  const job = await createMockJob({ id: episode.id });

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

  const { results } = await parseScrapeResultsProcessor(
    { job, scope: mockSentryScope },
    vi.fn(),
  );

  expect(Object.keys(results)).toHaveLength(3);
  expect(Object.values(results)).toEqual(
    expect.arrayContaining(
      rawTitles.map((title) =>
        expect.objectContaining({
          rawTitle: title,
        }),
      ),
    ),
  );
});

it("filters show torrents if the item is a movie", async ({
  indexedMovieContext: { indexedMovie },
  createMockJob,
  mockSentryScope,
}) => {
  const rawTitle = "Test Movie S01E01";

  const job = await createMockJob({ id: indexedMovie.id });

  vi.spyOn(job, "getChildrenValues").mockResolvedValue({
    "plugin[@repo/plugin-test]": {
      id: job.data.id,
      results: {
        "1234567890123456789012345678901234567890": rawTitle,
      },
    },
  });

  const { results } = await parseScrapeResultsProcessor(
    { job, scope: mockSentryScope },
    vi.fn(),
  );

  expect(Object.keys(results)).toHaveLength(0);
  expect(Object.values(results)).not.toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        rawTitle: rawTitle,
      }),
    ]),
  );
});

it("filters out torrents with 2 or fewer episodes for shows", async ({
  indexedShowContext: { indexedShow },
  createMockJob,
  mockSentryScope,
}) => {
  const rawTitle = "Test Show: S01E01";

  const job = await createMockJob({ id: indexedShow.id });

  vi.spyOn(job, "getChildrenValues").mockResolvedValue({
    "plugin[@repo/plugin-test]": {
      id: job.data.id,
      results: {
        "1434567890123456789012345678901234567890": rawTitle,
      },
    },
  });

  const { results } = await parseScrapeResultsProcessor(
    { job, scope: mockSentryScope },
    vi.fn(),
  );

  expect(Object.keys(results)).toHaveLength(0);
  expect(Object.values(results)).not.toEqual(
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
  indexedShowContext: { indexedShow },
  createMockJob,
  mockSentryScope,
}) => {
  const rawTitle = "Test Show: S01-03 E01-30";

  const job = await createMockJob({ id: indexedShow.id });

  vi.spyOn(job, "getChildrenValues").mockResolvedValue({
    "plugin[@repo/plugin-test]": {
      id: job.data.id,
      results: {
        "1434567890123456789012345678901234567890": rawTitle,
      },
    },
  });

  const { results } = await parseScrapeResultsProcessor(
    { job, scope: mockSentryScope },
    vi.fn(),
  );

  expect(Object.keys(results)).toHaveLength(0);
  expect(results).not.toEqual(
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
  em,
  indexedShowContext: { indexedShow },
  createMockJob,
  mockSentryScope,
}) => {
  const rawTitle = "Test Show: S01 E01-05";

  const job = await createMockJob({ id: indexedShow.id });

  vi.spyOn(job, "getChildrenValues").mockResolvedValue({
    "plugin[@repo/plugin-test]": {
      id: job.data.id,
      results: {
        "1434567890123456789012345678901234567890": rawTitle,
      },
    },
  });

  const [, ...seasonsToRemove] = indexedShow.seasons;

  em.remove(seasonsToRemove);

  await em.flush();

  const { results } = await parseScrapeResultsProcessor(
    { job, scope: mockSentryScope },
    vi.fn(),
  );

  expect(Object.keys(results)).toHaveLength(0);
  expect(results).not.toEqual(
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
  indexedMovieContext: { indexedMovie },
  createMockJob,
  mockSentryScope,
}) => {
  const rawTitle = "Test Movie: 1080p";

  const job = await createMockJob({ id: indexedMovie.id });

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

  const { results } = await parseScrapeResultsProcessor(
    { job, scope: mockSentryScope },
    vi.fn(),
  );

  expect(Object.keys(results)).toHaveLength(1);
  expect(Object.values(results)).toEqual([
    expect.objectContaining({
      rawTitle,
    }),
  ]);
});

it("filters out torrents with the incorrect season number for season items", async ({
  season,
  createMockJob,
  mockSentryScope,
}) => {
  const rawTitle = "Test Show 2024 S02 E01-10";

  const job = await createMockJob({ id: season.id });

  vi.spyOn(job, "getChildrenValues").mockResolvedValue({
    "plugin[@repo/plugin-test]": {
      id: job.data.id,
      results: {
        "1434567890123456789012345678901234567890": rawTitle,
      },
    },
  });

  const { results } = await parseScrapeResultsProcessor(
    { job, scope: mockSentryScope },
    vi.fn(),
  );

  expect(Object.keys(results)).toHaveLength(0);
  expect(results).not.toEqual(
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
  createMockJob,
  mockSentryScope,
}) => {
  const rawTitle = "Test Show 2024 S01 E01";

  const job = await createMockJob({ id: season.id });

  vi.spyOn(job, "getChildrenValues").mockResolvedValue({
    "plugin[@repo/plugin-test]": {
      id: job.data.id,
      results: {
        "1434567890123456789012345678901234567890": rawTitle,
      },
    },
  });

  const { results } = await parseScrapeResultsProcessor(
    { job, scope: mockSentryScope },
    vi.fn(),
  );

  expect(Object.keys(results)).toHaveLength(0);
  expect(results).not.toEqual(
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
  createMockJob,
  mockSentryScope,
}) => {
  const rawTitle = "Test Show 2024 S01 E30-50";

  const job = await createMockJob({ id: season.id });

  vi.spyOn(job, "getChildrenValues").mockResolvedValue({
    "plugin[@repo/plugin-test]": {
      id: job.data.id,
      results: {
        "1434567890123456789012345678901234567890": rawTitle,
      },
    },
  });

  const { results } = await parseScrapeResultsProcessor(
    { job, scope: mockSentryScope },
    vi.fn(),
  );

  expect(Object.keys(results)).toHaveLength(0);
  expect(results).not.toEqual(
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
  createMockJob,
  mockSentryScope,
}) => {
  const rawTitle = "Test Show 2024 S01E02";

  const job = await createMockJob({ id: episode.id });

  vi.spyOn(job, "getChildrenValues").mockResolvedValue({
    "plugin[@repo/plugin-test]": {
      id: job.data.id,
      results: {
        "1434567890123456789012345678901234567890": rawTitle,
      },
    },
  });

  const { results } = await parseScrapeResultsProcessor(
    { job, scope: mockSentryScope },
    vi.fn(),
  );

  expect(Object.keys(results)).toHaveLength(0);
  expect(results).not.toEqual(
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
  createMockJob,
  mockSentryScope,
}) => {
  const rawTitle = "Test Show 2024 S02E01";

  const job = await createMockJob({ id: episode.id });

  vi.spyOn(job, "getChildrenValues").mockResolvedValue({
    "plugin[@repo/plugin-test]": {
      id: job.data.id,
      results: {
        "1434567890123456789012345678901234567890": rawTitle,
      },
    },
  });

  const { results } = await parseScrapeResultsProcessor(
    { job, scope: mockSentryScope },
    vi.fn(),
  );

  expect(Object.keys(results)).toHaveLength(0);
  expect(results).not.toEqual(
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
  createMockJob,
  mockSentryScope,
}) => {
  const rawTitle = "Test Show 2024";

  const job = await createMockJob({ id: episode.id });

  vi.spyOn(job, "getChildrenValues").mockResolvedValue({
    "plugin[@repo/plugin-test]": {
      id: job.data.id,
      results: {
        "1434567890123456789012345678901234567890": rawTitle,
      },
    },
  });

  const { results } = await parseScrapeResultsProcessor(
    { job, scope: mockSentryScope },
    vi.fn(),
  );

  expect(results).not.toEqual(
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
  em,
  episode,
  createMockJob,
  mockSentryScope,
}) => {
  const rawTitle = "Test Show 2024 S01E01 [US]";

  em.persist(episode);
  em.assign(episode, { country: "UK" });

  await em.flush();

  const job = await createMockJob({ id: episode.id });

  vi.spyOn(job, "getChildrenValues").mockResolvedValue({
    "plugin[@repo/plugin-test]": {
      id: job.data.id,
      results: {
        "1434567890123456789012345678901234567890": rawTitle,
      },
    },
  });

  const { results } = await parseScrapeResultsProcessor(
    { job, scope: mockSentryScope },
    vi.fn(),
  );

  expect(Object.keys(results)).toHaveLength(0);
  expect(results).not.toEqual(
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
  em,
  episode,
  createMockJob,
  mockSentryScope,
}) => {
  const rawTitle = "Test Show 2024 S01E01 [US]";

  em.persist(episode);
  em.assign(episode, {
    country: "UK",
    language: "jp",
    genres: ["animation", "anime"],
  });

  await em.flush();

  const job = await createMockJob({ id: episode.id });

  vi.spyOn(job, "getChildrenValues").mockResolvedValue({
    "plugin[@repo/plugin-test]": {
      id: job.data.id,
      results: {
        "1434567890123456789012345678901234567890": rawTitle,
      },
    },
  });

  const { results } = await parseScrapeResultsProcessor(
    { job, scope: mockSentryScope },
    vi.fn(),
  );

  expect(Object.keys(results)).toHaveLength(1);
  expect(Object.values(results)).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        rawTitle,
      }),
    ]),
  );
});

it("filters out torrents that do not match the media item's year ± 1 year", async ({
  em,
  indexedMovieContext: { indexedMovie },
  createMockJob,
  mockSentryScope,
}) => {
  const rawTitles = [
    "Test Movie 2018 1080p",
    "Test Movie 2019 1080p",
    "Test Movie 2020 1080p",
    "Test Movie 2021 1080p",
    "Test Movie 2022 1080p",
  ] as const;

  em.persist(indexedMovie);
  em.assign(indexedMovie, {
    year: 2020,
  });

  await em.flush();

  const job = await createMockJob({ id: indexedMovie.id });

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

  const { results } = await parseScrapeResultsProcessor(
    { job, scope: mockSentryScope },
    vi.fn(),
  );

  expect(Object.keys(results)).toHaveLength(3);
  expect(Object.values(results)).toEqual(
    expect.arrayContaining(
      rawTitles.slice(1, 4).map((rawTitle) =>
        expect.objectContaining({
          rawTitle,
        }),
      ),
    ),
  );
});

it.skip('filters out torrents that are not dubbed if the media item is anime and the "dubbed anime only" setting is enabled', async ({
  em,
  indexedMovieContext: { indexedMovie },
  createMockJob,
  mockSentryScope,
}) => {
  const rawTitles = [
    "Test Movie 2018 1080p [Dubbed]",
    "Test Movie 2022 1080p",
  ] as const;

  em.persist(indexedMovie);
  em.assign(indexedMovie, {
    language: "jp",
    genres: ["animation", "anime"],
  });

  await em.flush();

  const job = await createMockJob({ id: indexedMovie.id });

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

  const { results } = await parseScrapeResultsProcessor(
    { job, scope: mockSentryScope },
    vi.fn(),
  );

  expect(Object.keys(results)).toHaveLength(1);
  expect(Object.values(results)).toEqual([
    expect.objectContaining({
      rawTitle: rawTitles[0],
    }),
  ]);
});

it.skip('does not filter out torrents that are not dubbed if the media item is anime and the "dubbed anime only" setting is disabled', async ({
  em,
  indexedMovieContext: { indexedMovie },
  createMockJob,
  mockSentryScope,
}) => {
  const rawTitles = [
    "Test Movie 2018 1080p [Dubbed]",
    "Test Movie 2022 1080p",
  ] as const;

  em.persist(indexedMovie);
  em.assign(indexedMovie, {
    language: "jp",
    genres: ["animation", "anime"],
  });

  await em.flush();

  const job = await createMockJob({ id: indexedMovie.id });

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

  const { results } = await parseScrapeResultsProcessor(
    { job, scope: mockSentryScope },
    vi.fn(),
  );

  expect(Object.keys(results)).toHaveLength(2);
  expect(results).toEqual(
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

it.skip("returns sorted results", async ({
  indexedMovieContext: { indexedMovie },
  createMockJob,
  mockSentryScope,
}) => {
  const rawTitles = [
    "Test Movie 2024 2160p",
    "Test Movie 2024 720p WEB-DL",
    "Test Movie 2024 1080p HDR10+ 5.1",
  ] as const;

  const job = await createMockJob({ id: indexedMovie.id });

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

  const { results } = await parseScrapeResultsProcessor(
    { job, scope: mockSentryScope },
    vi.fn(),
  );

  const expectedOrder = [rawTitles[2], rawTitles[0], rawTitles[1]] as const;

  expect(Object.keys(results)).toHaveLength(3);
  expect(results).toEqual(
    expectedOrder.map((rawTitle) =>
      expect.objectContaining({
        data: expect.objectContaining({
          rawTitle,
        }),
      }),
    ),
  );
});
