import { expect } from "vitest";

import { it } from "../../../../../__tests__/test-context.ts";
import { validateTorrentFiles } from "./validate-torrent-files.ts";

import type { MapItemsToFilesSandboxedJob } from "../../map-items-to-files/map-items-to-files.schema.ts";

type MappedFiles = MapItemsToFilesSandboxedJob["output"];

it.beforeAll(({ gqlServer: _gqlServer }) => {
  return;
});

it("throws an error if season-like torrent has fewer files than expected", async ({
  season,
  stream,
}) => {
  const mappedFiles = {
    episodes: {},
    movies: {
      "1": {
        name: `${season.show.getProperty("title")}.S01E01.1080p.WEB-DL.mkv`,
        path: `/${season.show.getProperty("title")}.S01E01.1080p.WEB-DL.mkv`,
        size: 5000000000,
        link: "http://example.com/file.mkv",
      },
    },
  } satisfies MappedFiles;

  await expect(
    validateTorrentFiles(season.id, stream.infoHash, mappedFiles, false),
  ).rejects.toThrow(
    `Season torrent must have at least ${season.episodes.length.toString()} episodes, but has 0`,
  );
});

it("considers torrents for continuing shows as valid if missing a maximum of one season", async ({
  indexedShowContext: { indexedShow },
  stream,
  em,
}) => {
  indexedShow.status = "continuing";

  await em.persist(indexedShow).flush();

  const episodes = await indexedShow.getEpisodes();

  const files = episodes.reduce<MappedFiles["episodes"]>((acc, episode) => {
    if (episode.season.getProperty("number") === indexedShow.seasons.length) {
      return acc;
    }

    acc[`abs:${episode.absoluteNumber.toString()}`] = {
      name: `${indexedShow.title}.E${episode.absoluteNumber.toString()}.1080p.WEB-DL.mkv`,
      path: `/${indexedShow.title}.E${episode.absoluteNumber.toString()}.1080p.WEB-DL.mkv`,
      size: 5000000000,
      link: "http://example.com/file.mkv",
    };

    return acc;
  }, {});

  const mappedFiles = {
    movies: {},
    episodes: files,
  } satisfies MappedFiles;

  await expect(
    validateTorrentFiles(indexedShow.id, stream.infoHash, mappedFiles, false),
  ).resolves.toHaveLength(episodes.length - 10);
});

it("considers torrents for completed shows as invalid if missing any season", async ({
  indexedShowContext: { indexedShow },
  stream,
}) => {
  const episodes = await indexedShow.getEpisodes();

  const files = episodes.reduce<MappedFiles["episodes"]>((acc, episode) => {
    if (episode.season.getProperty("number") === indexedShow.seasons.length) {
      return acc;
    }

    acc[`abs:${episode.absoluteNumber.toString()}`] = {
      name: `${indexedShow.title}.E${episode.absoluteNumber.toString()}.1080p.WEB-DL.mkv`,
      path: `/${indexedShow.title}.E${episode.absoluteNumber.toString()}.1080p.WEB-DL.mkv`,
      size: 5000000000,
      link: "http://example.com/file.mkv",
    };

    return acc;
  }, {});

  const mappedFiles = {
    movies: {},
    episodes: files,
  } satisfies MappedFiles;

  await expect(
    validateTorrentFiles(indexedShow.id, stream.infoHash, mappedFiles, false),
  ).rejects.toThrow(`Show torrent must have at least 60 episodes, but has 50`);
});

it("throws an error if file has no download URL", async ({
  indexedMovieContext: { indexedMovie },
  stream,
}) => {
  const mappedFiles = {
    movies: {
      1: {
        name: `${indexedMovie.title}.2024.1080p.WEB-DL.mkv`,
        path: `/${indexedMovie.title}.2024.1080p.WEB-DL.mkv`,
        size: 5000000000,
        link: "",
      },
    },
    episodes: {},
  } satisfies MappedFiles;

  await expect(
    validateTorrentFiles(indexedMovie.id, stream.infoHash, mappedFiles, false),
  ).rejects.toThrow("Expected at least 1 valid files, but found 0");
});

it("throws an error if movie file is parsed as a show", async ({
  indexedMovieContext: { indexedMovie },
  stream,
}) => {
  const mappedFiles = {
    movies: {
      1: {
        name: `${indexedMovie.title}.S01E01.1080p.WEB-DL.mkv`,
        path: `/${indexedMovie.title}.S01E01.1080p.WEB-DL.mkv`,
        size: 5000000000,
        link: "http://example.com/file.mkv",
      },
    },
    episodes: {},
  } satisfies MappedFiles;

  await expect(
    validateTorrentFiles(indexedMovie.id, stream.infoHash, mappedFiles, false),
  ).rejects.toThrow("Expected at least 1 valid files, but found 0");
});

it("throws an error if show file has unknown episode number", async ({
  indexedShowContext: { indexedShow },
  stream,
}) => {
  const episodes = await indexedShow.getEpisodes();

  const { "abs:1": _, ...files } = Object.fromEntries(
    episodes.map((episode) => [
      `abs:${episode.absoluteNumber.toString()}`,
      {
        name: `${indexedShow.title}.E${episode.absoluteNumber.toString()}.1080p.WEB-DL.mkv`,
        path: `/${indexedShow.title}.E${episode.absoluteNumber.toString()}.1080p.WEB-DL.mkv`,
        size: 5000000000,
        link: "http://example.com/file.mkv",
      },
    ]),
  );

  const mappedFiles = {
    episodes: {
      ...files,
      "abs:1": {
        name: `${indexedShow.title}.S01E00.1080p.WEB-DL.mkv`,
        path: `/${indexedShow.title}.S01E00.1080p.WEB-DL.mkv`,
        size: 5000000000,
        link: "http://example.com/file.mkv",
      },
    },
    movies: {},
  } satisfies MappedFiles;

  await expect(
    validateTorrentFiles(indexedShow.id, stream.infoHash, mappedFiles, false),
  ).rejects.toThrow(
    `Expected at least ${episodes.length.toString()} valid files, but found ${Object.keys(files).length.toString()}`,
  );
});

it("returns valid matched files for a movie", async ({
  indexedMovieContext: { indexedMovie },
  stream,
}) => {
  const mappedFiles = {
    movies: {
      0: {
        name: `${indexedMovie.title}.2024.1080p.WEB-DL.mkv`,
        path: `/${indexedMovie.title}.2024.1080p.WEB-DL.mkv`,
        size: 5000000000,
        link: "http://example.com/file.mkv",
      },
    },
    episodes: {},
  } satisfies MappedFiles;

  const result = await validateTorrentFiles(
    indexedMovie.id,
    stream.infoHash,
    mappedFiles,
    false,
  );

  expect(result).toHaveLength(1);

  expect.assert(result[0]);

  expect(result[0].matchedMediaItemId).toBe(indexedMovie.id);
  expect(result[0].name).toBe(`${indexedMovie.title}.2024.1080p.WEB-DL.mkv`);
});

it("returns valid matched files for a show", async ({
  indexedShowContext: { indexedShow },
  stream,
}) => {
  const episodes = await indexedShow.getEpisodes();

  const files = Object.fromEntries(
    episodes.map((episode) => [
      `abs:${episode.absoluteNumber.toString()}`,
      {
        name: `${indexedShow.title}.E${episode.absoluteNumber.toString()}.1080p.WEB-DL.mkv`,
        path: `/${indexedShow.title}.E${episode.absoluteNumber.toString()}.1080p.WEB-DL.mkv`,
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
    indexedShow.id,
    stream.infoHash,
    mappedFiles,
    false,
  );

  expect(result).toHaveLength(episodes.length);

  expect.assert(result[0]);
  expect.assert(episodes[0]);

  expect(result[0].name).toBe(`${indexedShow.title}.E1.1080p.WEB-DL.mkv`);
  expect(result[0].matchedMediaItemId).toBe(episodes[0].id);
});

it("does not match episodes from a different season", async ({
  season,
  stream,
}) => {
  const files = Object.fromEntries(
    season.episodes.map((episode) => [
      `${(episode.season.unwrap().number + 1).toString()}:${episode.number.toString()}`,
      {
        name: `${season.show.getProperty("title")}.E${episode.absoluteNumber.toString()}.1080p.WEB-DL.mkv`,
        path: `/${season.show.getProperty("title")}.E${episode.absoluteNumber.toString()}.1080p.WEB-DL.mkv`,
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
    validateTorrentFiles(season.id, stream.infoHash, mappedFiles, false),
  ).rejects.toThrow(
    `Expected at least ${season.episodes.length.toString()} valid files, but found 0`,
  );
});

it("throws an error if episode file does not match the episode", async ({
  episode,
  stream,
}) => {
  const show = await episode.getShow();
  const mappedFiles = {
    movies: {},
    episodes: {
      1: {
        name: `${show.title}.S02E01.1080p.WEB-DL.mkv`,
        path: `/${show.title}.S02E01.1080p.WEB-DL.mkv`,
        size: 5000000000,
        link: "http://example.com/file.mkv",
      },
    },
  } satisfies MappedFiles;

  await expect(
    validateTorrentFiles(episode.id, stream.infoHash, mappedFiles, false),
  ).rejects.toThrow("Expected at least 1 valid files, but found 0");
});
