import { expect } from "vitest";

import { rivenTestContext as it } from "../../../../../../__tests__/test-context.ts";
import { validateTorrentContainer } from "./validate-torrent-container.ts";

import type { TorrentContainer } from "@repo/util-plugin-sdk/schemas/torrents/torrent-container";

it("throws an error if season-like torrent has fewer files than expected", async ({
  season,
}) => {
  const container: TorrentContainer = {
    infoHash: "test",
    files: [
      {
        fileName: "Test.Show.S01E01.1080p.WEB-DL.mkv",
        fileSize: 5000000000,
        downloadUrl: "http://example.com/file.mkv",
      },
    ],
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

  await expect(validateTorrentContainer(season, container)).rejects.toThrow(
    `Season torrent container must have at least ${season.episodes.length.toString()} files, but has 1`,
  );
});

it("considers torrent containers for continuing shows as valid if missing a maximum of one season", async ({
  show,
  em,
}) => {
  show.status = "continuing";

  await em.persist(show).flush();

  const episodes = await show.getEpisodes();

  const files = episodes.reduce<TorrentContainer["files"]>(
    (acc, episode) => {
      if (episode.season.getProperty("number") === show.seasons.length) {
        return acc;
      }

      return [
        ...acc,
        {
          fileName: `Test.Show.E${episode.absoluteNumber.toString()}.1080p.WEB-DL.mkv`,
          fileSize: 5000000000,
          downloadUrl: "http://example.com/file.mkv",
        },
      ];
    },
    [] as unknown as TorrentContainer["files"],
  );

  const container: TorrentContainer = {
    infoHash: "test",
    files,
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

  await expect(validateTorrentContainer(show, container)).resolves.toHaveLength(
    episodes.length - 10,
  );
});

it("considers torrent containers for completed shows as invalid if missing any season", async ({
  show,
}) => {
  const episodes = await show.getEpisodes();

  const files = episodes.reduce<TorrentContainer["files"]>(
    (acc, episode) => {
      if (episode.season.getProperty("number") === show.seasons.length) {
        return acc;
      }

      return [
        ...acc,
        {
          fileName: `Test.Show.E${episode.absoluteNumber.toString()}.1080p.WEB-DL.mkv`,
          fileSize: 5000000000,
          downloadUrl: "http://example.com/file.mkv",
        },
      ];
    },
    [] as unknown as TorrentContainer["files"],
  );

  const container: TorrentContainer = {
    infoHash: "test",
    files,
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

  await expect(validateTorrentContainer(show, container)).rejects.toThrow(
    `Show torrent container must have at least 60 files, but has 50`,
  );
});

it("throws an error if file has no download URL", async ({ movie }) => {
  const container: TorrentContainer = {
    infoHash: "test",
    files: [
      {
        fileName: "Test.Movie.2024.1080p.WEB-DL.mkv",
        fileSize: 5000000000,
        downloadUrl: "",
      },
    ],
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

  await expect(validateTorrentContainer(movie, container)).rejects.toThrow(
    "Expected 1 valid files, but found 0",
  );
});

it("throws an error if movie file is parsed as a show", async ({ movie }) => {
  const container: TorrentContainer = {
    infoHash: "test",
    files: [
      {
        fileName: "Test.Show.S01E01.1080p.WEB-DL.mkv",
        fileSize: 5000000000,
        downloadUrl: "http://example.com/file.mkv",
      },
    ],
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

  await expect(validateTorrentContainer(movie, container)).rejects.toThrow(
    "Expected 1 valid files, but found 0",
  );
});

it("throws an error if show file has no episode number", async ({ show }) => {
  const episodes = await show.getEpisodes();

  const [, ...files] = episodes.map((episode) => ({
    fileName: `Test.Show.E${episode.absoluteNumber.toString()}.1080p.WEB-DL.mkv`,
    fileSize: 5000000000,
    downloadUrl: "http://example.com/file.mkv",
  })) as [unknown, ...TorrentContainer["files"]];

  const container: TorrentContainer = {
    infoHash: "test",
    files: [
      {
        fileName: "Test.Episode.WEB-DL.mkv",
        fileSize: 5000000000,
        downloadUrl: "http://example.com/file.mkv",
      },
      ...files,
    ],
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

  await expect(validateTorrentContainer(show, container)).rejects.toThrow(
    `Expected ${episodes.length.toString()} valid files, but found ${files.length.toString()}`,
  );
});

it("throws an error if show file has unknown episode number", async ({
  show,
}) => {
  const episodes = await show.getEpisodes();

  const [, ...files] = episodes.map((episode) => ({
    fileName: `Test.Show.E${episode.absoluteNumber.toString()}.1080p.WEB-DL.mkv`,
    fileSize: 5000000000,
    downloadUrl: "http://example.com/file.mkv",
  })) as [unknown, ...TorrentContainer["files"]];

  const container: TorrentContainer = {
    infoHash: "test",
    files: [
      ...files,
      {
        fileName: "Test.Show.S01E00.1080p.WEB-DL.mkv",
        fileSize: 5000000000,
        downloadUrl: "http://example.com/file.mkv",
      },
    ],
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

  await expect(validateTorrentContainer(show, container)).rejects.toThrow(
    `Expected ${episodes.length.toString()} valid files, but found ${files.length.toString()}`,
  );
});

it("throws an error if show file has unknown season number", async ({
  show,
}) => {
  const episodes = await show.getEpisodes();

  const [, ...files] = episodes.map((episode) => ({
    fileName: `Test.Show.E${episode.absoluteNumber.toString()}.1080p.WEB-DL.mkv`,
    fileSize: 5000000000,
    downloadUrl: "http://example.com/file.mkv",
  })) as [unknown, ...TorrentContainer["files"]];

  const container: TorrentContainer = {
    infoHash: "test",
    files: [
      {
        fileName: "Test.Show.S00E01.1080p.WEB-DL.mkv",
        fileSize: 5000000000,
        downloadUrl: "http://example.com/file.mkv",
      },
      ...files,
    ],
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

  await expect(validateTorrentContainer(show, container)).rejects.toThrow(
    `Expected ${episodes.length.toString()} valid files, but found ${files.length.toString()}`,
  );
});

it("returns valid matched files for a movie", async ({ movie }) => {
  const container: TorrentContainer = {
    infoHash: "test",
    files: [
      {
        fileName: "Test.Movie.2024.1080p.WEB-DL.mkv",
        fileSize: 5000000000,
        downloadUrl: "http://example.com/file.mkv",
      },
    ],
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

  const result = await validateTorrentContainer(movie, container);

  expect(result).toHaveLength(1);

  expect.assert(result[0]);

  expect(result[0].matchedMediaItemId).toBe(movie.id);
  expect(result[0].fileName).toBe("Test.Movie.2024.1080p.WEB-DL.mkv");
});

it("returns valid matched files for a show", async ({ show }) => {
  const episodes = await show.getEpisodes();

  const files = episodes.map((episode) => ({
    fileName: `Test.Show.E${episode.absoluteNumber.toString()}.1080p.WEB-DL.mkv`,
    fileSize: 5000000000,
    downloadUrl: "http://example.com/file.mkv",
  })) as TorrentContainer["files"];

  const container: TorrentContainer = {
    infoHash: "test",
    files,
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

  const result = await validateTorrentContainer(show, container);

  expect(result).toHaveLength(episodes.length);

  expect.assert(result[0]);
  expect.assert(episodes[0]);

  expect(result[0].fileName).toBe("Test.Show.E1.1080p.WEB-DL.mkv");
  expect(result[0].matchedMediaItemId).toBe(episodes[0].id);
});

it("throws an error if season file episode does not belong to expected season", async ({
  season,
}) => {
  const [, ...files] = season.episodes.map((episode) => ({
    fileName: `Test.Show.E${episode.absoluteNumber.toString()}.1080p.WEB-DL.mkv`,
    fileSize: 5000000000,
    downloadUrl: "http://example.com/file.mkv",
  })) as [unknown, ...TorrentContainer["files"]];

  const container: TorrentContainer = {
    infoHash: "test",
    files: [
      {
        fileName: "Test.Show.S02E01.1080p.WEB-DL.mkv",
        fileSize: 5000000000,
        downloadUrl: "http://example.com/file.mkv",
      },
      ...files,
    ],
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

  await expect(validateTorrentContainer(season, container)).rejects.toThrow(
    `Expected ${season.episodes.length.toString()} valid files, but found ${files.length.toString()}`,
  );
});

it("throws an error if episode file does not match the episode", async ({
  episode,
}) => {
  const container: TorrentContainer = {
    infoHash: "test",
    files: [
      {
        fileName: "Test.Show.S02E01.1080p.WEB-DL.mkv",
        fileSize: 5000000000,
        downloadUrl: "http://example.com/file.mkv",
      },
    ],
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

  await expect(validateTorrentContainer(episode, container)).rejects.toThrow(
    "Expected 1 valid files, but found 0",
  );
});
