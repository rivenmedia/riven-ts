import { SubtitleEntry } from "@repo/util-plugin-sdk/dto/entities";

import { expect } from "vitest";

import { it as baseIt } from "#__tests__/test-context.ts";

import type { SubtitleData } from "@repo/util-plugin-sdk/schemas/events/media-item.subtitle-requested.event";

const it = baseIt.extend(
  "createSubtitle",
  () =>
    (
      language: string,
      overrides: Partial<SubtitleData> = {},
    ): SubtitleData => ({
      language,
      content: `1\n00:00:01,000 --> 00:00:02,000\n${language} subtitle\n`,
      fileHash: `${language}-hash`,
      fileSize: 42,
      sourceProvider: "test-provider",
      ...overrides,
    }),
);

it("saves a subtitle entry for each new language of a movie", async ({
  createSubtitle,
  completedMovieContext: { completedMovie },
  em,
  services: { subtitlesService },
}) => {
  const saved = await subtitlesService.saveSubtitles(
    completedMovie.id,
    new Map([
      ["en", createSubtitle("en", { sourceId: "source-en" })],
      ["fr", createSubtitle("fr")],
    ]),
  );

  expect(saved).toBe(2);

  const entries = await em.find(
    SubtitleEntry,
    { mediaItem: completedMovie.id },
    { orderBy: { language: "asc" } },
  );

  expect(
    entries.map(({ language, content, fileHash, sourceId, path }) => ({
      language,
      content,
      fileHash,
      sourceId,
      path,
    })),
  ).toStrictEqual([
    {
      language: "en",
      content: createSubtitle("en").content,
      fileHash: "en-hash",
      sourceId: "source-en",
      path: expect.stringMatching(/\.en\.srt$/u),
    },
    {
      language: "fr",
      content: createSubtitle("fr").content,
      fileHash: "fr-hash",
      sourceId: null,
      path: expect.stringMatching(/\.fr\.srt$/u),
    },
  ]);
});

it("skips languages that already have a subtitle entry", async ({
  createSubtitle,
  completedMovieContext: { completedMovie },
  em,
  services: { subtitlesService },
}) => {
  await subtitlesService.saveSubtitles(
    completedMovie.id,
    new Map([["en", createSubtitle("en")]]),
  );

  const saved = await subtitlesService.saveSubtitles(
    completedMovie.id,
    new Map([
      ["en", createSubtitle("en", { content: "replacement content" })],
      ["de", createSubtitle("de")],
    ]),
  );

  expect(saved).toBe(1);

  const entries = await em.find(
    SubtitleEntry,
    { mediaItem: completedMovie.id },
    { orderBy: { language: "asc" } },
  );

  expect(
    entries.map(({ language, content }) => ({ language, content })),
  ).toStrictEqual([
    { language: "de", content: createSubtitle("de").content },
    { language: "en", content: createSubtitle("en").content },
  ]);
});

it("saves nothing when every language already has a subtitle entry", async ({
  createSubtitle,
  completedMovieContext: { completedMovie },
  em,
  services: { subtitlesService },
}) => {
  await subtitlesService.saveSubtitles(
    completedMovie.id,
    new Map([["en", createSubtitle("en")]]),
  );

  await expect(
    subtitlesService.saveSubtitles(
      completedMovie.id,
      new Map([["en", createSubtitle("en")]]),
    ),
  ).resolves.toBe(0);

  await expect(
    em.count(SubtitleEntry, { mediaItem: completedMovie.id }),
  ).resolves.toBe(1);
});

it("saves subtitle entries for an episode under its show and season directories", async ({
  createSubtitle,
  completedShowContext: { episodes },
  em,
  services: { subtitlesService },
}) => {
  const [episode] = episodes;

  expect.assert(episode);

  await expect(
    subtitlesService.saveSubtitles(
      episode.id,
      new Map([["en", createSubtitle("en")]]),
    ),
  ).resolves.toBe(1);

  const entry = await em.findOneOrFail(SubtitleEntry, {
    mediaItem: episode.id,
  });

  expect(entry.path).toMatch(/\{tvdb-\d+\}\/Season \d{2}\/.+\.en\.srt$/u);
});

it("rejects saving subtitles for a show", async ({
  createSubtitle,
  completedShowContext: { completedShow },
  em,
  services: { subtitlesService },
}) => {
  await expect(
    subtitlesService.saveSubtitles(
      completedShow.id,
      new Map([["en", createSubtitle("en")]]),
    ),
  ).rejects.toThrow(
    `MediaItem with ID ${completedShow.id} is not a Movie or Episode, cannot save subtitles`,
  );

  await expect(em.count(SubtitleEntry)).resolves.toBe(0);
});

it("returns the episodes of a show for subtitle processing", async ({
  completedShowContext: { completedShow, episodes },
  services: { subtitlesService },
}) => {
  const items = await subtitlesService.getItemsForSubtitlesProcessing(
    completedShow.id,
  );

  expect(items.map(({ id }) => id).toSorted()).toStrictEqual(
    episodes.map(({ id }) => id).toSorted(),
  );
});

it("returns the episodes of a season for subtitle processing", async ({
  completedShowContext: { seasons, episodes },
  services: { subtitlesService },
}) => {
  const [season] = seasons;

  expect.assert(season);

  const seasonEpisodeIds = episodes
    .filter((episode) => episode.season.id === season.id)
    .map(({ id }) => id)
    .toSorted();

  expect(seasonEpisodeIds.length).toBeGreaterThan(0);

  const items = await subtitlesService.getItemsForSubtitlesProcessing(
    season.id,
  );

  expect(items.map(({ id }) => id).toSorted()).toStrictEqual(seasonEpisodeIds);
});

it("returns a movie on its own for subtitle processing", async ({
  completedMovieContext: { completedMovie },
  services: { subtitlesService },
}) => {
  const items = await subtitlesService.getItemsForSubtitlesProcessing(
    completedMovie.id,
  );

  expect(items.map(({ id }) => id)).toStrictEqual([completedMovie.id]);
});

it("rejects items that have not been downloaded", async ({
  indexedMovieContext: { indexedMovie },
  services: { subtitlesService },
}) => {
  await expect(
    subtitlesService.getItemsForSubtitlesProcessing(indexedMovie.id),
  ).rejects.toThrow("MediaItem not found");
});
