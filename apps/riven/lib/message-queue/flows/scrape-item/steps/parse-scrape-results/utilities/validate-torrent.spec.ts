import { parse } from "@repo/util-rank-torrent-name";

import { faker } from "@faker-js/faker";
import { wrap } from "@mikro-orm/core";
import { expect, vi } from "vitest";

import { rivenTestContext as baseIt } from "../../../../../../__tests__/test-context.ts";
import * as settingsModule from "../../../../../../utilities/settings.ts";
import { SkippedTorrentError, validateTorrent } from "./validate-torrent.ts";

const it = baseIt
  .extend("scrapeResults", {
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
  })
  .extend("infoHash", () => faker.git.commitSha());

it("does not throw for movie torrents if the item is a movie", async ({
  movie,
  infoHash,
}) => {
  const rawTitle = "Test Movie 2024 1080p WEB-DL";
  const parsedData = parse(rawTitle);

  await expect(
    validateTorrent(movie, movie.title, parsedData, infoHash),
  ).resolves.not.toThrow();
});

it("does not throw for show torrents if the item is a show", async ({
  show,
  infoHash,
}) => {
  const rawTitle = "Test Show: The Complete Series (Season 1,2,3,4,5&6) E01-60";
  const parsedData = parse(rawTitle);

  await expect(
    validateTorrent(show, show.title, parsedData, infoHash),
  ).resolves.not.toThrow();
});

it("does not throw for season torrents if the item is a season", async ({
  season,
  infoHash,
}) => {
  const rawTitle = "Test Show 2024 1080p WEB-DL S01 E01-10";
  const show = await season.getShow();

  const parsedData = parse(rawTitle);

  await expect(
    validateTorrent(season, show.title, parsedData, infoHash),
  ).resolves.not.toThrow();
});

it("does not throw for episode torrents if the item is an episode", async ({
  episode,
  infoHash,
}) => {
  const rawTitle = "Test Show 2024 1080p WEB-DL S01E01";
  const show = await episode.getShow();
  const parsedData = parse(rawTitle);

  await expect(
    validateTorrent(episode, show.title, parsedData, infoHash),
  ).resolves.not.toThrow();
});

it("throws for show torrents if the item is a movie", async ({
  movie,
  infoHash,
}) => {
  const rawTitle = "Test Movie S01E01";
  const parsedData = parse(rawTitle);

  await expect(
    validateTorrent(movie, movie.title, parsedData, infoHash),
  ).rejects.toThrow(
    new SkippedTorrentError(
      `Skipping show torrent for movie`,
      movie.title,
      parsedData.rawTitle,
      infoHash,
    ),
  );
});

it("throws for torrents with an incorrect number of seasons for ended shows", async ({
  em,
  show,
  infoHash,
  annotate,
}) => {
  await annotate(
    "Torrents must contain all seasons for ended shows, as there will be no new seasons to download in the future.",
  );

  const rawTitle = "Test Show: S01-03";

  em.persist(show);
  em.assign(show, { status: "ended" });

  await em.flush();

  const parsedData = parse(rawTitle);

  await expect(
    validateTorrent(show, show.title, parsedData, infoHash),
  ).rejects.toThrow(
    new SkippedTorrentError(
      `Skipping torrent with incorrect number of seasons`,
      show.title,
      parsedData.rawTitle,
      infoHash,
    ),
  );
});

it("throws for torrents with an incorrect number of seasons for continuing shows", async ({
  em,
  show,
  infoHash,
  annotate,
}) => {
  await annotate(
    "Torrents may be missing the most recent season for continuing shows, but they must not be missing more than that.",
  );

  const rawTitle = "Test Show: S01-03";

  em.persist(show);
  em.assign(show, { status: "continuing" });

  await em.flush();

  const parsedData = parse(rawTitle);

  await expect(
    validateTorrent(show, show.title, parsedData, infoHash),
  ).rejects.toThrow(
    new SkippedTorrentError(
      `Skipping torrent with incorrect number of seasons`,
      show.title,
      parsedData.rawTitle,
      infoHash,
    ),
  );
});

it("does not throw for torrents that do not contain the most recent season for continuing shows", async ({
  em,
  show,
  infoHash,
}) => {
  const rawTitle = "Test Show: S01-05";

  em.persist(show);
  em.assign(show, { status: "continuing" });

  await em.flush();

  const parsedData = parse(rawTitle);

  await expect(
    validateTorrent(show, show.title, parsedData, infoHash),
  ).resolves.not.toThrow();
});

it("does not throw for torrents that contain all seasons for ended shows", async ({
  em,
  show,
  infoHash,
}) => {
  const rawTitle = "Test Show: S01-06";

  em.persist(show);
  em.assign(show, { status: "ended" });

  await em.flush();

  const parsedData = parse(rawTitle);

  await expect(
    validateTorrent(show, show.title, parsedData, infoHash),
  ).resolves.not.toThrow();
});

it("throws for torrents with no seasons and episodes for show-like items", async ({
  show,
  infoHash,
}) => {
  const rawTitle = "Test Show";

  const parsedData = parse(rawTitle);

  await expect(
    validateTorrent(show, show.title, parsedData, infoHash),
  ).rejects.toThrow(
    new SkippedTorrentError(
      `Skipping torrent with no seasons or episodes for show item`,
      show.title,
      parsedData.rawTitle,
      infoHash,
    ),
  );
});

it("throws for torrents with incorrect number of episodes for single-season shows", async ({
  em,
  show,
  infoHash,
}) => {
  await wrap(show).populate(["seasons"]);

  const rawTitle = "Test Show: S01 E01-05";

  const [, ...seasonsToRemove] = show.seasons;

  em.remove(seasonsToRemove);

  await em.flush();

  const parsedData = parse(rawTitle);

  await expect(
    validateTorrent(show, show.title, parsedData, infoHash),
  ).rejects.toThrow(
    new SkippedTorrentError(
      `Skipping torrent with incorrect number of episodes for single-season show`,
      show.title,
      parsedData.rawTitle,
      infoHash,
    ),
  );
});

it("does not throw for torrents with the correct number of episodes for single-season shows", async ({
  em,
  show,
  infoHash,
}) => {
  const rawTitle = "Test Show: S01 E01-10";

  await wrap(show).populate(["seasons"]);

  const [, ...seasonsToRemove] = show.seasons;

  em.remove(seasonsToRemove);

  await em.flush();

  const parsedData = parse(rawTitle);

  await expect(
    validateTorrent(show, show.title, parsedData, infoHash),
  ).resolves.not.toThrow();
});

it("does not throw for torrents that have no seasons, but the correct absolute episode range for season items", async ({
  show,
  infoHash,
}) => {
  await wrap(show).populate(["seasons"]);

  const season = show.seasons[2];

  expect.assert(season);

  const rawTitle = "Test Show 2024 20-50";

  const parsedData = parse(rawTitle);

  await expect(
    validateTorrent(season, show.title, parsedData, infoHash),
  ).resolves.not.toThrow();
});

it("throws for torrents that have no seasons and do not have the correct absolute episode range for season items", async ({
  show,
  infoHash,
}) => {
  await wrap(show).populate(["seasons"]);

  const season = show.seasons[2];

  expect.assert(season);

  const rawTitle = "Test Show 2024 1-10";

  const parsedData = parse(rawTitle);

  await expect(
    validateTorrent(season, show.title, parsedData, infoHash),
  ).rejects.toThrow(
    new SkippedTorrentError(
      `Skipping torrent with incorrect absolute episode range for season item`,
      show.title,
      parsedData.rawTitle,
      infoHash,
    ),
  );
});

it("throws for torrents with incorrect season number for season items", async ({
  season,
  infoHash,
}) => {
  const rawTitle = "Test Show 2024 S02 E01-10";
  const show = await season.getShow();

  const parsedData = parse(rawTitle);

  await expect(() =>
    validateTorrent(season, show.title, parsedData, infoHash),
  ).rejects.toThrow(
    new SkippedTorrentError(
      `Skipping torrent with incorrect season number for season item`,
      show.title,
      parsedData.rawTitle,
      infoHash,
    ),
  );
});

it("does not throw for torrents with an unknown number of episodes for season items", async ({
  season,
  infoHash,
}) => {
  const rawTitle = "Test Show: S01";
  const show = await season.getShow();

  const parsedData = parse(rawTitle);

  await expect(
    validateTorrent(season, show.title, parsedData, infoHash),
  ).resolves.not.toThrow();
});

it("throws for torrents with incorrect episodes for season items", async ({
  season,
  infoHash,
}) => {
  const rawTitle = "Test Show 2024 S01 E30-50";
  const show = await season.getShow();

  const parsedData = parse(rawTitle);

  await expect(
    validateTorrent(season, show.title, parsedData, infoHash),
  ).rejects.toThrow(
    new SkippedTorrentError(
      `Skipping torrent with incorrect episodes for season item`,
      show.title,
      parsedData.rawTitle,
      infoHash,
    ),
  );
});

it("throws for torrents with incorrect episode number for episode items", async ({
  episode,
  infoHash,
}) => {
  const rawTitle = "Test Show 2024 S01 E30-50";
  const show = await episode.getShow();

  const parsedData = parse(rawTitle);

  await expect(
    validateTorrent(episode, show.title, parsedData, infoHash),
  ).rejects.toThrow(
    new SkippedTorrentError(
      `Skipping torrent with incorrect episode number for episode item`,
      show.title,
      parsedData.rawTitle,
      infoHash,
    ),
  );
});

it("throws for torrents with incorrect season number for episode items", async ({
  episode,
  infoHash,
}) => {
  const rawTitle = "Test Show 2024 S02E01";
  const show = await episode.getShow();

  const parsedData = parse(rawTitle);

  await expect(
    validateTorrent(episode, show.title, parsedData, infoHash),
  ).rejects.toThrow(
    new SkippedTorrentError(
      `Skipping torrent with incorrect season number for episode item`,
      show.title,
      parsedData.rawTitle,
      infoHash,
    ),
  );
});

it("throws for torrents with no episodes for episode items", async ({
  episode,
  infoHash,
}) => {
  const rawTitle = "Test Show 2024";
  const show = await episode.getShow();

  const parsedData = parse(rawTitle);

  await expect(
    validateTorrent(episode, show.title, parsedData, infoHash),
  ).rejects.toThrow(
    new SkippedTorrentError(
      `Skipping torrent with no seasons or episodes for episode item`,
      show.title,
      parsedData.rawTitle,
      infoHash,
    ),
  );
});

it("throws for torrents that do not match the media item's country", async ({
  em,
  movie,
  infoHash,
}) => {
  const rawTitle = "Test Movie 2024 [US]";

  em.persist(movie);
  em.assign(movie, { country: "UK" });

  await em.flush();

  const parsedData = parse(rawTitle);

  await expect(
    validateTorrent(movie, movie.title, parsedData, infoHash),
  ).rejects.toThrow(
    new SkippedTorrentError(
      `Skipping torrent with incorrect country`,
      movie.title,
      parsedData.rawTitle,
      infoHash,
    ),
  );
});

it("does not throw for torrents that do not match the media item's country if the media item is anime", async ({
  em,
  movie,
  infoHash,
}) => {
  const rawTitle = "Test Movie 2024 [US]";

  em.persist(movie);
  em.assign(movie, {
    country: "UK",
    language: "jp",
    genres: ["animation", "anime"],
  });

  await em.flush();

  const parsedData = parse(rawTitle);

  await expect(
    validateTorrent(movie, movie.title, parsedData, infoHash),
  ).resolves.not.toThrow();
});

it("throws for torrents that do not match the media item's year (± 1 year)", async ({
  em,
  movie,
  infoHash,
}) => {
  const badTitles = ["Test Movie 2018 1080p", "Test Movie 2022 1080p"] as const;

  const goodTitles = [
    "Test Movie 2019 1080p",
    "Test Movie 2020 1080p",
    "Test Movie 2021 1080p",
  ] as const;

  em.persist(movie);
  em.assign(movie, { year: 2020 });

  await em.flush();

  for (const rawTitle of badTitles) {
    const parsedData = parse(rawTitle);

    await expect(
      validateTorrent(movie, movie.title, parsedData, infoHash),
    ).rejects.toThrow(
      new SkippedTorrentError(
        `Skipping torrent with incorrect year`,
        movie.title,
        parsedData.rawTitle,
        infoHash,
      ),
    );
  }

  for (const rawTitle of goodTitles) {
    const parsedData = parse(rawTitle);

    await expect(
      validateTorrent(movie, movie.title, parsedData, infoHash),
    ).resolves.not.toThrow();
  }
});

it.skip('throws for torrents that are not dubbed if the media item is anime and the "dubbed anime only" setting is enabled', async ({
  em,
  movie,
  infoHash,
}) => {
  const rawTitle = "Test Movie 2020 1080p";

  vi.spyOn(settingsModule, "settings", "get").mockReturnValue({
    ...settingsModule.settings,
    dubbedAnimeOnly: true,
  });

  em.persist(movie);
  em.assign(movie, { language: "jp", genres: ["animation", "anime"] });

  await em.flush();

  const parsedData = parse(rawTitle);

  await expect(
    validateTorrent(movie, movie.title, parsedData, infoHash),
  ).rejects.toThrow(
    new SkippedTorrentError(
      `Skipping non-dubbed anime torrent`,
      movie.title,
      parsedData.rawTitle,
      infoHash,
    ),
  );
});

it.skip('does not throw for torrents that are not dubbed if the media item is anime and the "dubbed anime only" setting is disabled', async ({
  em,
  movie,
  infoHash,
}) => {
  const rawTitle = "Test Movie 2020 1080p";

  vi.spyOn(settingsModule, "settings", "get").mockReturnValue({
    ...settingsModule.settings,
    dubbedAnimeOnly: false,
  });

  em.persist(movie);
  em.assign(movie, { language: "jp", genres: ["animation", "anime"] });

  await em.flush();

  const parsedData = parse(rawTitle);

  await expect(
    validateTorrent(movie, movie.title, parsedData, infoHash),
  ).resolves.not.toThrow();
});

it('does not throw for torrents that are not dubbed if the media item is anime and the "dubbed anime only" setting is enabled', async ({
  em,
  movie,
  infoHash,
}) => {
  const rawTitle = "Test Movie 2020 1080p [Dubbed]";

  vi.spyOn(settingsModule, "settings", "get").mockReturnValue({
    ...settingsModule.settings,
    dubbedAnimeOnly: true,
  });

  em.persist(movie);
  em.assign(movie, { language: "jp", genres: ["animation", "anime"] });

  await em.flush();

  const parsedData = parse(rawTitle);

  await expect(
    validateTorrent(movie, movie.title, parsedData, infoHash),
  ).resolves.not.toThrow();
});
