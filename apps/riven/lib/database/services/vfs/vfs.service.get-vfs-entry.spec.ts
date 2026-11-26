import { MediaEntry, SubtitleEntry } from "@repo/util-plugin-sdk/dto/entities";

import { expect } from "vitest";

import { it as baseIt } from "#__tests__/test-context.ts";

const subtitleContent = "1\n00:00:01,000 --> 00:00:02,000\nHello\n";

const it = baseIt.extend(
  "episodeEntries",
  async ({
    completedShowContext: { episodes },
    em,
    services: { subtitlesService },
  }) => {
    const [episode] = episodes;

    expect.assert(episode);

    await subtitlesService.saveSubtitles(
      episode.id,
      new Map([
        [
          "en",
          {
            language: "en",
            content: subtitleContent,
            fileHash: "hash",
            fileSize: subtitleContent.length,
            sourceProvider: "test-provider",
          },
        ],
      ]),
    );

    const mediaEntry = await em.findOneOrFail(
      MediaEntry,
      { mediaItem: episode.id },
      { populate: ["mediaItem"] },
    );
    const subtitleEntry = await em.findOneOrFail(
      SubtitleEntry,
      { mediaItem: episode.id },
      { populate: ["mediaItem"] },
    );

    return {
      mediaEntry,
      subtitleEntry,
      mediaPath: `/${mediaEntry.baseDirectory}/${mediaEntry.path}`,
      subtitlePath: `/${subtitleEntry.baseDirectory}/${subtitleEntry.path}`,
    };
  },
);

it("finds the media entry for an episode path", async ({
  episodeEntries: { mediaEntry, mediaPath },
  services: { vfsService },
}) => {
  const entry = await vfsService.getVfsEntry(mediaPath);

  expect(entry).toBeInstanceOf(MediaEntry);
  expect(entry?.id).toBe(mediaEntry.id);
});

it("finds the subtitle entry for an episode subtitle path", async ({
  episodeEntries: { subtitleEntry, subtitlePath },
  services: { vfsService },
}) => {
  const entry = await vfsService.getVfsEntry(subtitlePath);

  expect(entry).toBeInstanceOf(SubtitleEntry);
  expect(entry?.id).toBe(subtitleEntry.id);
});

it("finds the subtitle entry for a movie subtitle path", async ({
  completedMovieContext: { completedMovie },
  em,
  services: { subtitlesService, vfsService },
}) => {
  await subtitlesService.saveSubtitles(
    completedMovie.id,
    new Map([
      [
        "en",
        {
          language: "en",
          content: subtitleContent,
          fileHash: "hash",
          fileSize: subtitleContent.length,
          sourceProvider: "test-provider",
        },
      ],
    ]),
  );

  const subtitleEntry = await em.findOneOrFail(
    SubtitleEntry,
    { mediaItem: completedMovie.id },
    { populate: ["mediaItem"] },
  );

  const entry = await vfsService.getVfsEntry(
    `/${subtitleEntry.baseDirectory}/${subtitleEntry.path}`,
  );

  expect(entry?.id).toBe(subtitleEntry.id);
});

it("does not match an episode from a different season", async ({
  episodeEntries: { mediaPath, subtitlePath },
  services: { vfsService },
}) => {
  const otherSeason = (path: string) =>
    path.replace(/Season \d{2}/u, "Season 99");

  await expect(
    vfsService.getVfsEntry(otherSeason(mediaPath)),
  ).resolves.toBeNull();
  await expect(
    vfsService.getVfsEntry(otherSeason(subtitlePath)),
  ).resolves.toBeNull();
});

it.for(["/shows/Some Show/Season 01/file.mkv", "/shows/Some Show/file.en.srt"])(
  "returns no entry for a path without media IDs (%s)",
  async (path, { services: { vfsService } }) => {
    await expect(vfsService.getVfsEntry(path)).resolves.toBeNull();
  },
);
