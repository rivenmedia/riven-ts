import { expect } from "vitest";

import { rivenTestContext as it } from "../../../../../../__tests__/test-context.ts";
import { validateTorrentContainer } from "./validate-torrent-container.ts";

import type { MapItemsToFilesFlow } from "../../map-items-to-files/map-items-to-files.schema.ts";

type MappedTorrentContainer = MapItemsToFilesFlow["output"];

it("throws an error if season-like torrent has fewer files than expected", async ({
  season,
}) => {
  const mappedTorrentContainer: MappedTorrentContainer = {
    infoHash: "test",
    files: {
      episodes: {},
      movies: {
        "1": {
          fileName: "Test.Show.S01E01.1080p.WEB-DL.mkv",
          fileSize: 5000000000,
          downloadUrl: "http://example.com/file.mkv",
        },
      },
    },
    torrentId: 1,
    torrentInfo: {
      files: {},
      infoHash: "test",
      name: "test",
      id: "test",
      isCached: true,
      links: [],
      sizeMB: 100,
      alternativeFilename: "",
    },
  };

  await expect(
    validateTorrentContainer(season, "test", mappedTorrentContainer),
  ).rejects.toThrow(
    `Season torrent container must have at least ${season.episodes.length.toString()} episodes, but has 0`,
  );
});

it("considers torrent containers for continuing shows as valid if missing a maximum of one season", async ({
  show,
  em,
}) => {
  show.status = "continuing";

  await em.persist(show).flush();

  const episodes = await show.getEpisodes();

  const files = episodes.reduce<MappedTorrentContainer["files"]["episodes"]>(
    (acc, episode) => {
      if (episode.season.getProperty("number") === show.seasons.length) {
        return acc;
      }

      return {
        ...acc,
        [`abs:${episode.absoluteNumber.toString()}`]: {
          fileName: `Test.Show.E${episode.absoluteNumber.toString()}.1080p.WEB-DL.mkv`,
          fileSize: 5000000000,
          downloadUrl: "http://example.com/file.mkv",
        },
      };
    },
    {},
  );

  const container: MappedTorrentContainer = {
    infoHash: "test",
    files: {
      movies: {},
      episodes: files,
    },
    torrentId: 1,
    torrentInfo: {
      files: {},
      infoHash: "test",
      name: "test",
      id: "test",
      isCached: true,
      links: [],
      sizeMB: 100,
      alternativeFilename: "",
    },
  };

  await expect(
    validateTorrentContainer(show, "test", container),
  ).resolves.toHaveLength(episodes.length - 10);
});

it("considers torrent containers for completed shows as invalid if missing any season", async ({
  show,
}) => {
  const episodes = await show.getEpisodes();

  const files = episodes.reduce<MappedTorrentContainer["files"]["episodes"]>(
    (acc, episode) => {
      if (episode.season.getProperty("number") === show.seasons.length) {
        return acc;
      }

      return {
        ...acc,
        [`abs:${episode.absoluteNumber.toString()}`]: {
          fileName: `Test.Show.E${episode.absoluteNumber.toString()}.1080p.WEB-DL.mkv`,
          fileSize: 5000000000,
          downloadUrl: "http://example.com/file.mkv",
        },
      };
    },
    {},
  );

  const container: MappedTorrentContainer = {
    infoHash: "test",
    files: {
      movies: {},
      episodes: files,
    },
    torrentId: 1,
    torrentInfo: {
      files: {},
      infoHash: "test",
      name: "test",
      id: "test",
      isCached: true,
      links: [],
      sizeMB: 100,
      alternativeFilename: "",
    },
  };

  await expect(
    validateTorrentContainer(show, "test", container),
  ).rejects.toThrow(
    `Show torrent container must have at least 60 episodes, but has 50`,
  );
});

it("throws an error if file has no download URL", async ({ movie }) => {
  const container: MappedTorrentContainer = {
    infoHash: "test",
    files: {
      movies: {
        1: {
          fileName: "Test.Movie.2024.1080p.WEB-DL.mkv",
          fileSize: 5000000000,
          downloadUrl: "",
        },
      },
      episodes: {},
    },
    torrentId: 1,
    torrentInfo: {
      files: {},
      infoHash: "test",
      name: "test",
      id: "test",
      isCached: true,
      links: [],
      sizeMB: 100,
      alternativeFilename: "",
    },
  };

  await expect(
    validateTorrentContainer(movie, "test", container),
  ).rejects.toThrow("Expected 1 valid files, but found 0");
});

it("throws an error if movie file is parsed as a show", async ({ movie }) => {
  const container: MappedTorrentContainer = {
    infoHash: "test",
    files: {
      movies: {
        1: {
          fileName: "Test.Show.S01E01.1080p.WEB-DL.mkv",
          fileSize: 5000000000,
          downloadUrl: "http://example.com/file.mkv",
        },
      },
      episodes: {},
    },
    torrentId: 1,
    torrentInfo: {
      files: {},
      infoHash: "test",
      name: "test",
      id: "test",
      isCached: true,
      links: [],
      sizeMB: 100,
      alternativeFilename: "",
    },
  };

  await expect(
    validateTorrentContainer(movie, "test", container),
  ).rejects.toThrow("Expected 1 valid files, but found 0");
});

it("throws an error if show file has unknown episode number", async ({
  show,
}) => {
  const episodes = await show.getEpisodes();

  const { "abs:1": _, ...files } = Object.fromEntries(
    episodes.map((episode) => [
      `abs:${episode.absoluteNumber.toString()}`,
      {
        fileName: `Test.Show.E${episode.absoluteNumber.toString()}.1080p.WEB-DL.mkv`,
        fileSize: 5000000000,
        downloadUrl: "http://example.com/file.mkv",
      },
    ]),
  ) as MappedTorrentContainer["files"]["episodes"];

  const container: MappedTorrentContainer = {
    infoHash: "test",
    files: {
      episodes: {
        ...files,
        "abs:1": {
          fileName: "Test.Show.S01E00.1080p.WEB-DL.mkv",
          fileSize: 5000000000,
          downloadUrl: "http://example.com/file.mkv",
        },
      },
      movies: {},
    },
    torrentId: 1,
    torrentInfo: {
      files: {},
      infoHash: "test",
      name: "test",
      id: "test",
      isCached: true,
      links: [],
      sizeMB: 100,
      alternativeFilename: "",
    },
  };

  await expect(
    validateTorrentContainer(show, "test", container),
  ).rejects.toThrow(
    `Expected ${episodes.length.toString()} valid files, but found ${Object.keys(files).length.toString()}`,
  );
});

it("returns valid matched files for a movie", async ({ movie }) => {
  const container: MappedTorrentContainer = {
    infoHash: "test",
    files: {
      movies: {
        1: {
          fileName: "Test.Movie.2024.1080p.WEB-DL.mkv",
          fileSize: 5000000000,
          downloadUrl: "http://example.com/file.mkv",
        },
      },
      episodes: {},
    },
    torrentId: 1,
    torrentInfo: {
      files: {},
      infoHash: "test",
      name: "test",
      id: "test",
      isCached: true,
      links: [],
      sizeMB: 100,
      alternativeFilename: "",
    },
  };

  const result = await validateTorrentContainer(movie, "test", container);

  expect(result).toHaveLength(1);

  expect.assert(result[0]);

  expect(result[0].matchedMediaItemId).toBe(movie.id);
  expect(result[0].fileName).toBe("Test.Movie.2024.1080p.WEB-DL.mkv");
});

it("returns valid matched files for a show", async ({ show }) => {
  const episodes = await show.getEpisodes();

  const files = Object.fromEntries(
    episodes.map((episode) => [
      `abs:${episode.absoluteNumber.toString()}`,
      {
        fileName: `Test.Show.E${episode.absoluteNumber.toString()}.1080p.WEB-DL.mkv`,
        fileSize: 5000000000,
        downloadUrl: "http://example.com/file.mkv",
      },
    ]),
  ) as MappedTorrentContainer["files"]["episodes"];

  const container: MappedTorrentContainer = {
    infoHash: "test",
    files: {
      episodes: files,
      movies: {},
    },
    torrentId: 1,
    torrentInfo: {
      files: {},
      infoHash: "test",
      name: "test",
      id: "test",
      isCached: true,
      links: [],
      sizeMB: 100,
      alternativeFilename: "",
    },
  };

  const result = await validateTorrentContainer(show, "test", container);

  expect(result).toHaveLength(episodes.length);

  expect.assert(result[0]);
  expect.assert(episodes[0]);

  expect(result[0].fileName).toBe("Test.Show.E1.1080p.WEB-DL.mkv");
  expect(result[0].matchedMediaItemId).toBe(episodes[0].id);
});

it("does not match episodes from a different season", async ({ season }) => {
  const files = Object.fromEntries(
    season.episodes.map((episode) => [
      `${(episode.season.unwrap().number + 1).toString()}:${episode.number.toString()}`,
      {
        fileName: `Test.Show.E${episode.absoluteNumber.toString()}.1080p.WEB-DL.mkv`,
        fileSize: 5000000000,
        downloadUrl: "http://example.com/file.mkv",
      },
    ]),
  ) as MappedTorrentContainer["files"]["episodes"];

  const container: MappedTorrentContainer = {
    infoHash: "test",
    files: {
      movies: {},
      episodes: files,
    },
    torrentId: 1,
    torrentInfo: {
      files: {},
      infoHash: "test",
      name: "test",
      id: "test",
      isCached: true,
      links: [],
      sizeMB: 100,
      alternativeFilename: "",
    },
  };

  await expect(
    validateTorrentContainer(season, "test", container),
  ).rejects.toThrow(
    `Expected ${season.episodes.length.toString()} valid files, but found 0`,
  );
});

it("throws an error if episode file does not match the episode", async ({
  episode,
}) => {
  const container: MappedTorrentContainer = {
    infoHash: "test",
    files: {
      movies: {},
      episodes: {
        1: {
          fileName: "Test.Show.S02E01.1080p.WEB-DL.mkv",
          fileSize: 5000000000,
          downloadUrl: "http://example.com/file.mkv",
        },
      },
    },
    torrentId: 1,
    torrentInfo: {
      files: {},
      infoHash: "test",
      name: "test",
      id: "test",
      isCached: true,
      links: [],
      sizeMB: 100,
      alternativeFilename: "",
    },
  };

  await expect(
    validateTorrentContainer(episode, "test", container),
  ).rejects.toThrow("Expected 1 valid files, but found 0");
});
