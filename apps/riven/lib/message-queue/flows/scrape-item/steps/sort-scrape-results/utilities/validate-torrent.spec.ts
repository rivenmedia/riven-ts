import {
  Episode,
  Movie,
  Season,
  Show,
} from "@repo/util-plugin-sdk/dto/entities";
import { createSettings, rankTorrent } from "@repo/util-rank-torrent-name";

import { it as baseIt, expect, vi } from "vitest";

import { database } from "../../../../../../database/database.ts";
import * as settingsModule from "../../../../../../utilities/settings.ts";
import { SkippedTorrentError, validateTorrent } from "./validate-torrent.ts";

const it = baseIt.extend<{
  movie: Movie;
  show: Show;
  season: Season;
  episode: Episode;
  scrapeResults: Record<string, string>;
}>({
  movie: async ({}, use) => {
    const em = database.em.fork();
    const movie = em.create(Movie, {
      title: "Test Movie",
      contentRating: "g",
      state: "indexed",
      tmdbId: "1",
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
      tvdbId: "1",
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

it("does not throw for movie torrents if the item is a movie", async ({
  movie,
}) => {
  const rawTitle = "Test Movie 2024 1080p WEB-DL";

  const torrent = rankTorrent(
    rawTitle,
    "1234567890123456789012345678901234567890",
    movie.title,
    createSettings(),
  );

  await expect(
    validateTorrent(movie, movie.title, torrent),
  ).resolves.not.toThrow();
});

it("does not throw for show torrents if the item is a show", async ({
  show,
}) => {
  const rawTitle = "Test Show: The Complete Series (Season 1,2,3,4,5&6) E01-60";

  const torrent = rankTorrent(
    rawTitle,
    "1234567890123456789012345678901234567890",
    show.title,
    createSettings(),
  );

  await expect(
    validateTorrent(show, show.title, torrent),
  ).resolves.not.toThrow();
});

it("does not throw for season torrents if the item is a season", async ({
  season,
}) => {
  const rawTitle = "Test Show 2024 1080p WEB-DL S01 E01-10";
  const showTitle = await season.getShowTitle();

  const torrent = rankTorrent(
    rawTitle,
    "1234567890123456789012345678901234567890",
    showTitle,
    createSettings(),
  );

  await expect(
    validateTorrent(season, showTitle, torrent),
  ).resolves.not.toThrow();
});

it("does not throw for episode torrents if the item is an episode", async ({
  episode,
}) => {
  const rawTitle = "Test Show 2024 1080p WEB-DL S01E01";
  const showTitle = await episode.getShowTitle();

  const torrent = rankTorrent(
    rawTitle,
    "1234567890123456789012345678901234567890",
    showTitle,
    createSettings(),
  );

  await expect(
    validateTorrent(episode, showTitle, torrent),
  ).resolves.not.toThrow();
});

it("throws for show torrents if the item is a movie", async ({ movie }) => {
  const rawTitle = "Test Movie S01E01";

  const torrent = rankTorrent(
    rawTitle,
    "1234567890123456789012345678901234567890",
    movie.title,
    createSettings(),
  );

  await expect(validateTorrent(movie, movie.title, torrent)).rejects.toThrow(
    new SkippedTorrentError(
      `Skipping show torrent for movie`,
      movie.title,
      torrent.data.rawTitle,
      torrent.hash,
    ),
  );
});

it("throws for torrents with 2 or fewer episodes for shows", async ({
  show,
}) => {
  const rawTitle = "Test Show: S01E01";

  const torrent = rankTorrent(
    rawTitle,
    "1234567890123456789012345678901234567890",
    show.title,
    createSettings(),
  );

  await expect(validateTorrent(show, show.title, torrent)).rejects.toThrow(
    new SkippedTorrentError(
      `Skipping torrent with 2 or fewer episodes for show`,
      show.title,
      torrent.data.rawTitle,
      torrent.hash,
    ),
  );
});

it("throws for torrents with an incorrect number of seasons for shows", async ({
  show,
}) => {
  const rawTitle = "Test Show: S01-03 E01-30";

  const torrent = rankTorrent(
    rawTitle,
    "1234567890123456789012345678901234567890",
    show.title,
    createSettings(),
  );

  await expect(validateTorrent(show, show.title, torrent)).rejects.toThrow(
    new SkippedTorrentError(
      `Skipping torrent with incorrect number of seasons`,
      show.title,
      torrent.data.rawTitle,
      torrent.hash,
    ),
  );
});

it("throws for torrents with incorrect number of episodes for single-season shows", async ({
  show,
}) => {
  const rawTitle = "Test Show: S01 E01-05";

  const em = database.em.fork();

  const [, ...seasonsToRemove] = show.seasons;

  em.remove(seasonsToRemove);

  await em.flush();

  const torrent = rankTorrent(
    rawTitle,
    "1234567890123456789012345678901234567890",
    show.title,
    createSettings(),
  );

  await expect(validateTorrent(show, show.title, torrent)).rejects.toThrow(
    new SkippedTorrentError(
      `Skipping torrent with incorrect number of episodes for single-season show`,
      show.title,
      torrent.data.rawTitle,
      torrent.hash,
    ),
  );
});

it("does not throw for torrents with the correct number of episodes for single-season shows", async ({
  show,
}) => {
  const rawTitle = "Test Show: S01 E01-10";

  const em = database.em.fork();

  const [, ...seasonsToRemove] = show.seasons;

  em.remove(seasonsToRemove);

  await em.flush();

  const torrent = rankTorrent(
    rawTitle,
    "1234567890123456789012345678901234567890",
    show.title,
    createSettings(),
  );

  await expect(
    validateTorrent(show, show.title, torrent),
  ).resolves.not.toThrow();
});

it("throws for torrents with no seasons for season items", async ({
  season,
}) => {
  const rawTitle = "Test Show 2024 E01-10";
  const showTitle = await season.getShowTitle();

  const torrent = rankTorrent(
    rawTitle,
    "1234567890123456789012345678901234567890",
    showTitle,
    createSettings(),
  );

  await expect(validateTorrent(season, showTitle, torrent)).rejects.toThrow(
    new SkippedTorrentError(
      `Skipping torrent with no seasons for season item`,
      showTitle,
      torrent.data.rawTitle,
      torrent.hash,
    ),
  );
});

it("throws for torrents with incorrect season number for season items", async ({
  season,
}) => {
  const rawTitle = "Test Show 2024 S02 E01-10";
  const showTitle = await season.getShowTitle();

  const torrent = rankTorrent(
    rawTitle,
    "1234567890123456789012345678901234567890",
    showTitle,
    createSettings(),
  );

  await expect(() =>
    validateTorrent(season, showTitle, torrent),
  ).rejects.toThrow(
    new SkippedTorrentError(
      `Skipping torrent with incorrect season number for season item`,
      showTitle,
      torrent.data.rawTitle,
      torrent.hash,
    ),
  );
});

it("does not throw for torrents with an unknown number of episodes for season items", async ({
  season,
}) => {
  const rawTitle = "Test Show: S01";
  const showTitle = await season.getShowTitle();

  const torrent = rankTorrent(
    rawTitle,
    "1234567890123456789012345678901234567890",
    showTitle,
    createSettings(),
  );

  await expect(
    validateTorrent(season, showTitle, torrent),
  ).resolves.not.toThrow();
});

it("throws for torrents with 2 or fewer episodes for season items", async ({
  season,
}) => {
  const rawTitle = "Test Show 2024 S01E01";
  const showTitle = await season.getShowTitle();

  const torrent = rankTorrent(
    rawTitle,
    "1234567890123456789012345678901234567890",
    showTitle,
    createSettings(),
  );

  await expect(() =>
    validateTorrent(season, showTitle, torrent),
  ).rejects.toThrow(
    new SkippedTorrentError(
      `Skipping torrent with 2 or fewer episodes for season item`,
      showTitle,
      torrent.data.rawTitle,
      torrent.hash,
    ),
  );
});

it("throws for torrents with incorrect episodes for season items", async ({
  season,
}) => {
  const rawTitle = "Test Show 2024 S01 E30-50";
  const showTitle = await season.getShowTitle();

  const torrent = rankTorrent(
    rawTitle,
    "1234567890123456789012345678901234567890",
    showTitle,
    createSettings(),
  );

  await expect(validateTorrent(season, showTitle, torrent)).rejects.toThrow(
    new SkippedTorrentError(
      `Skipping torrent with incorrect episodes for season item`,
      showTitle,
      torrent.data.rawTitle,
      torrent.hash,
    ),
  );
});

it("throws for torrents with incorrect episode number for episode items", async ({
  episode,
}) => {
  const rawTitle = "Test Show 2024 S01 E30-50";
  const showTitle = await episode.getShowTitle();

  const torrent = rankTorrent(
    rawTitle,
    "1234567890123456789012345678901234567890",
    showTitle,
    createSettings(),
  );

  await expect(validateTorrent(episode, showTitle, torrent)).rejects.toThrow(
    new SkippedTorrentError(
      `Skipping torrent with incorrect episode number for episode item`,
      showTitle,
      torrent.data.rawTitle,
      torrent.hash,
    ),
  );
});

it("throws for torrents with incorrect season number for episode items", async ({
  episode,
}) => {
  const rawTitle = "Test Show 2024 S02E01";
  const showTitle = await episode.getShowTitle();

  const torrent = rankTorrent(
    rawTitle,
    "1234567890123456789012345678901234567890",
    showTitle,
    createSettings(),
  );

  await expect(validateTorrent(episode, showTitle, torrent)).rejects.toThrow(
    new SkippedTorrentError(
      `Skipping torrent with incorrect season number for episode item`,
      showTitle,
      torrent.data.rawTitle,
      torrent.hash,
    ),
  );
});

it("throws for torrents with no episodes for episode items", async ({
  episode,
}) => {
  const rawTitle = "Test Show 2024";
  const showTitle = await episode.getShowTitle();

  const torrent = rankTorrent(
    rawTitle,
    "1234567890123456789012345678901234567890",
    showTitle,
    createSettings(),
  );

  await expect(validateTorrent(episode, showTitle, torrent)).rejects.toThrow(
    new SkippedTorrentError(
      `Skipping torrent with no seasons or episodes for episode item`,
      showTitle,
      torrent.data.rawTitle,
      torrent.hash,
    ),
  );
});

it("throws for torrents that do not match the media item's country", async ({
  movie,
}) => {
  const rawTitle = "Test Movie 2024 [US]";

  const em = database.em.fork();

  em.persist(movie);
  em.assign(movie, { country: "UK" });

  await em.flush();

  const torrent = rankTorrent(
    rawTitle,
    "1234567890123456789012345678901234567890",
    movie.title,
    createSettings(),
  );

  await expect(validateTorrent(movie, movie.title, torrent)).rejects.toThrow(
    new SkippedTorrentError(
      `Skipping torrent with incorrect country`,
      movie.title,
      torrent.data.rawTitle,
      torrent.hash,
    ),
  );
});

it("does not throw for torrents that do not match the media item's country if the media item is anime", async ({
  movie,
}) => {
  const rawTitle = "Test Movie 2024 [US]";

  const em = database.em.fork();

  em.persist(movie);
  em.assign(movie, {
    country: "UK",
    language: "jp",
    genres: ["animation", "anime"],
  });

  await em.flush();

  const torrent = rankTorrent(
    rawTitle,
    "1234567890123456789012345678901234567890",
    movie.title,
    createSettings(),
  );

  await expect(
    validateTorrent(movie, movie.title, torrent),
  ).resolves.not.toThrow();
});

it("throws for torrents that do not match the media item's year (± 1 year)", async ({
  movie,
}) => {
  const badTitles = ["Test Movie 2018 1080p", "Test Movie 2022 1080p"] as const;

  const goodTitles = [
    "Test Movie 2019 1080p",
    "Test Movie 2020 1080p",
    "Test Movie 2021 1080p",
  ] as const;

  const em = database.em.fork();

  em.persist(movie);
  em.assign(movie, { year: 2020 });

  await em.flush();

  for (const rawTitle of badTitles) {
    const torrent = rankTorrent(
      rawTitle,
      "1234567890123456789012345678901234567890",
      movie.title,
      createSettings(),
    );

    await expect(validateTorrent(movie, movie.title, torrent)).rejects.toThrow(
      new SkippedTorrentError(
        `Skipping torrent with incorrect year`,
        movie.title,
        torrent.data.rawTitle,
        torrent.hash,
      ),
    );
  }

  for (const rawTitle of goodTitles) {
    const torrent = rankTorrent(
      rawTitle,
      "1234567890123456789012345678901234567890",
      movie.title,
      createSettings(),
    );

    await expect(
      validateTorrent(movie, movie.title, torrent),
    ).resolves.not.toThrow();
  }
});

it('throws for torrents that are not dubbed if the media item is anime and the "dubbed anime only" setting is enabled', async ({
  movie,
}) => {
  const rawTitle = "Test Movie 2020 1080p";

  vi.spyOn(settingsModule, "settings", "get").mockReturnValue({
    ...settingsModule.settings,
    dubbedAnimeOnly: true,
  });

  const em = database.em.fork();

  em.persist(movie);
  em.assign(movie, { language: "jp", genres: ["animation", "anime"] });

  await em.flush();

  const torrent = rankTorrent(
    rawTitle,
    "1234567890123456789012345678901234567890",
    movie.title,
    createSettings(),
  );

  await expect(validateTorrent(movie, movie.title, torrent)).rejects.toThrow(
    new SkippedTorrentError(
      `Skipping non-dubbed anime torrent`,
      movie.title,
      torrent.data.rawTitle,
      torrent.hash,
    ),
  );
});

it('does not throw for torrents that are not dubbed if the media item is anime and the "dubbed anime only" setting is disabled', async ({
  movie,
}) => {
  const rawTitle = "Test Movie 2020 1080p";

  vi.spyOn(settingsModule, "settings", "get").mockReturnValue({
    ...settingsModule.settings,
    dubbedAnimeOnly: false,
  });

  const em = database.em.fork();

  em.persist(movie);
  em.assign(movie, { language: "jp", genres: ["animation", "anime"] });

  await em.flush();

  const torrent = rankTorrent(
    rawTitle,
    "1234567890123456789012345678901234567890",
    movie.title,
    createSettings(),
  );

  await expect(
    validateTorrent(movie, movie.title, torrent),
  ).resolves.not.toThrow();
});

it('does not throw for torrents that are not dubbed if the media item is anime and the "dubbed anime only" setting is enabled', async ({
  movie,
}) => {
  const rawTitle = "Test Movie 2020 1080p [Dubbed]";

  vi.spyOn(settingsModule, "settings", "get").mockReturnValue({
    ...settingsModule.settings,
    dubbedAnimeOnly: true,
  });

  const em = database.em.fork();

  em.persist(movie);
  em.assign(movie, { language: "jp", genres: ["animation", "anime"] });

  await em.flush();

  const torrent = rankTorrent(
    rawTitle,
    "1234567890123456789012345678901234567890",
    movie.title,
    createSettings(),
  );

  await expect(
    validateTorrent(movie, movie.title, torrent),
  ).resolves.not.toThrow();
});
