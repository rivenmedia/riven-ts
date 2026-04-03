import { expect } from "vitest";

import { it } from "../../../../../__tests__/test-context.ts";
import { validateTorrentFiles } from "./validate-torrent-files.ts";

import type { MapItemsToFilesSandboxedJob } from "../../map-items-to-files/map-items-to-files.schema.ts";

type MappedFiles = MapItemsToFilesSandboxedJob["output"];

it("throws an error if season-like torrent has fewer files than expected", async ({
  season,
}) => {
  const mappedFiles = {
    episodes: {},
    movies: {
      "1": {
        name: "Test.Show.S01E01.1080p.WEB-DL.mkv",
        path: "/Test.Show.S01E01.1080p.WEB-DL.mkv",
        size: 5000000000,
        link: "http://example.com/file.mkv",
      },
    },
  } satisfies MappedFiles;

  await expect(
    validateTorrentFiles(season, "test", mappedFiles, false),
  ).rejects.toThrow(
    `Season torrent must have at least ${season.episodes.length.toString()} episodes, but has 0`,
  );
});

it("considers torrents for continuing shows as valid if missing a maximum of one season", async ({
  indexedShowContext: { indexedShow },
  em,
}) => {
  indexedShow.status = "continuing";

  await em.persist(indexedShow).flush();

  const episodes = await indexedShow.getEpisodes();

  const files = episodes.reduce<MappedFiles["episodes"]>((acc, episode) => {
    if (episode.season.getProperty("number") === indexedShow.seasons.length) {
      return acc;
    }

    return {
      ...acc,
      [`abs:${episode.absoluteNumber.toString()}`]: {
        name: `Test.Show.E${episode.absoluteNumber.toString()}.1080p.WEB-DL.mkv`,
        path: `/Test.Show.E${episode.absoluteNumber.toString()}.1080p.WEB-DL.mkv`,
        size: 5000000000,
        link: "http://example.com/file.mkv",
      },
    };
  }, {});

  const mappedFiles = {
    movies: {},
    episodes: files,
  } satisfies MappedFiles;

  await expect(
    validateTorrentFiles(indexedShow, "test", mappedFiles, false),
  ).resolves.toHaveLength(episodes.length - 10);
});

it("considers torrents for completed shows as invalid if missing any season", async ({
  indexedShowContext: { indexedShow },
}) => {
  const episodes = await indexedShow.getEpisodes();

  const files = episodes.reduce<MappedFiles["episodes"]>((acc, episode) => {
    if (episode.season.getProperty("number") === indexedShow.seasons.length) {
      return acc;
    }

    return {
      ...acc,
      [`abs:${episode.absoluteNumber.toString()}`]: {
        name: `Test.Show.E${episode.absoluteNumber.toString()}.1080p.WEB-DL.mkv`,
        path: `/Test.Show.E${episode.absoluteNumber.toString()}.1080p.WEB-DL.mkv`,
        size: 5000000000,
        link: "http://example.com/file.mkv",
      },
    };
  }, {});

  const mappedFiles = {
    movies: {},
    episodes: files,
  } satisfies MappedFiles;

  await expect(
    validateTorrentFiles(indexedShow, "test", mappedFiles, false),
  ).rejects.toThrow(`Show torrent must have at least 60 episodes, but has 50`);
});

it("throws an error if file has no download URL", async ({
  indexedMovieContext: { indexedMovie },
}) => {
  const mappedFiles = {
    movies: {
      1: {
        name: "Test.Movie.2024.1080p.WEB-DL.mkv",
        path: "/Test.Movie.2024.1080p.WEB-DL.mkv",
        size: 5000000000,
        link: "",
      },
    },
    episodes: {},
  } satisfies MappedFiles;

  await expect(
    validateTorrentFiles(indexedMovie, "test", mappedFiles, false),
  ).rejects.toThrow("Expected at least 1 valid files, but found 0");
});

it("throws an error if movie file is parsed as a show", async ({
  indexedMovieContext: { indexedMovie },
}) => {
  const mappedFiles = {
    movies: {
      1: {
        name: "Test.Show.S01E01.1080p.WEB-DL.mkv",
        path: "/Test.Show.S01E01.1080p.WEB-DL.mkv",
        size: 5000000000,
        link: "http://example.com/file.mkv",
      },
    },
    episodes: {},
  } satisfies MappedFiles;

  await expect(
    validateTorrentFiles(indexedMovie, "test", mappedFiles, false),
  ).rejects.toThrow("Expected at least 1 valid files, but found 0");
});

it("throws an error if show file has unknown episode number", async ({
  indexedShowContext: { indexedShow },
}) => {
  const episodes = await indexedShow.getEpisodes();

  const { "abs:1": _, ...files } = Object.fromEntries(
    episodes.map((episode) => [
      `abs:${episode.absoluteNumber.toString()}`,
      {
        name: `Test.Show.E${episode.absoluteNumber.toString()}.1080p.WEB-DL.mkv`,
        path: `/Test.Show.E${episode.absoluteNumber.toString()}.1080p.WEB-DL.mkv`,
        size: 5000000000,
        link: "http://example.com/file.mkv",
      },
    ]),
  );

  const mappedFiles = {
    episodes: {
      ...files,
      "abs:1": {
        name: "Test.Show.S01E00.1080p.WEB-DL.mkv",
        path: "Test.Show.S01E00.1080p.WEB-DL.mkv",
        size: 5000000000,
        link: "http://example.com/file.mkv",
      },
    },
    movies: {},
  } satisfies MappedFiles;

  await expect(
    validateTorrentFiles(indexedShow, "test", mappedFiles, false),
  ).rejects.toThrow(
    `Expected at least ${episodes.length.toString()} valid files, but found ${Object.keys(files).length.toString()}`,
  );
});

it("returns valid matched files for a movie", async ({
  indexedMovieContext: { indexedMovie },
}) => {
  const mappedFiles = {
    movies: {
      0: {
        name: "Test.Movie.2024.1080p.WEB-DL.mkv",
        path: "/Test.Movie.2024.1080p.WEB-DL.mkv",
        size: 5000000000,
        link: "http://example.com/file.mkv",
      },
    },
    episodes: {},
  } satisfies MappedFiles;

  const result = await validateTorrentFiles(
    indexedMovie,
    "test",
    mappedFiles,
    false,
  );

  expect(result).toHaveLength(1);

  expect.assert(result[0]);

  expect(result[0].matchedMediaItemId).toBe(indexedMovie.id);
  expect(result[0].name).toBe("Test.Movie.2024.1080p.WEB-DL.mkv");
});

it("returns valid matched files for a show", async ({
  indexedShowContext: { indexedShow },
}) => {
  const episodes = await indexedShow.getEpisodes();

  const files = Object.fromEntries(
    episodes.map((episode) => [
      `abs:${episode.absoluteNumber.toString()}`,
      {
        name: `Test.Show.E${episode.absoluteNumber.toString()}.1080p.WEB-DL.mkv`,
        path: `/Test.Show.E${episode.absoluteNumber.toString()}.1080p.WEB-DL.mkv`,
        size: 5000000000,
        link: "http://example.com/file.mkv",
      },
    ]),
  );

  const mappedFiles = {
    episodes: files,
    movies: {},
  } satisfies MappedFiles;

  const result = await validateTorrentFiles(
    indexedShow,
    "test",
    mappedFiles,
    false,
  );

  expect(result).toHaveLength(episodes.length);

  expect.assert(result[0]);
  expect.assert(episodes[0]);

  expect(result[0].name).toBe("Test.Show.E1.1080p.WEB-DL.mkv");
  expect(result[0].matchedMediaItemId).toBe(episodes[0].id);
});

it("does not match episodes from a different season", async ({ season }) => {
  const files = Object.fromEntries(
    season.episodes.map((episode) => [
      `${(episode.season.unwrap().number + 1).toString()}:${episode.number.toString()}`,
      {
        name: `Test.Show.E${episode.absoluteNumber.toString()}.1080p.WEB-DL.mkv`,
        path: `/Test.Show.E${episode.absoluteNumber.toString()}.1080p.WEB-DL.mkv`,
        size: 5000000000,
        link: "http://example.com/file.mkv",
      },
    ]),
  ) as MappedFiles["episodes"];

  const mappedFiles = {
    movies: {},
    episodes: files,
  } satisfies MappedFiles;

  await expect(
    validateTorrentFiles(season, "test", mappedFiles, false),
  ).rejects.toThrow(
    `Expected at least ${season.episodes.length.toString()} valid files, but found 0`,
  );
});

it("throws an error if episode file does not match the episode", async ({
  episode,
}) => {
  const mappedFiles = {
    movies: {},
    episodes: {
      1: {
        name: "Test.Show.S02E01.1080p.WEB-DL.mkv",
        path: "/Test.Show.S02E01.1080p.WEB-DL.mkv",
        size: 5000000000,
        link: "http://example.com/file.mkv",
      },
    },
  } satisfies MappedFiles;

  await expect(
    validateTorrentFiles(episode, "test", mappedFiles, false),
  ).rejects.toThrow("Expected at least 1 valid files, but found 0");
});
