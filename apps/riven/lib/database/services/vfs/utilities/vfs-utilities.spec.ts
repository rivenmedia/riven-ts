import { describe, expect } from "vitest";

import { it } from "../../../../__tests__/test-context.ts";
import { PathInfo } from "../schemas/path-info.schema.ts";
import { getVfsMediaEntry } from "./get-vfs-media-entry.ts";
import { getEntry } from "./get-vfs-path-entry.ts";
import { getVfsSubtitleEntry } from "./get-vfs-subtitle-entry.ts";

describe("getVfsMediaEntry", () => {
  it("returns a media entry for a movie path with tmdbId", async ({
    seeders: { seedCompletedMovie },
    em,
  }) => {
    const { movie } = await seedCompletedMovie();
    const pathInfo = PathInfo.parse(
      `/movies/${movie.title} {tmdb-${movie.tmdbId}}/${movie.title}.mkv`,
    );

    const result = await getVfsMediaEntry(em, pathInfo);

    expect(result).not.toBeNull();
    expect(result?.mediaItem.getEntity().tmdbId).toBe(movie.tmdbId);
  });

  it("returns a media entry for an episode path with tvdbId", async ({
    seeders: { seedCompletedShow },
    em,
  }) => {
    const { show, episodes } = await seedCompletedShow();

    expect.assert(episodes[0]);

    const episode = episodes[0];
    const season = await episode.season.loadOrFail();

    const pathInfo = PathInfo.parse(
      `/shows/${show.title} {tvdb-${show.tvdbId}}/Season ${season.number.toString().padStart(2, "0")}/s${season.number.toString().padStart(2, "0")}e${episode.number.toString().padStart(2, "0")}.mkv`,
    );

    const result = await getVfsMediaEntry(em, pathInfo);

    expect(result).not.toBeNull();
  });

  it("returns null when no matching path info", async ({ em }) => {
    const pathInfo = PathInfo.parse(
      "/movies/Nonexistent {tmdb-999999}/file.mkv",
    );

    const result = await getVfsMediaEntry(em, pathInfo);

    expect(result).toBeNull();
  });
});

describe("getVfsSubtitleEntry", () => {
  it("returns null when no subtitles exist for a movie path", async ({
    seeders: { seedCompletedMovie },
    em,
  }) => {
    const { movie } = await seedCompletedMovie();
    const pathInfo = PathInfo.parse(
      `/movies/${movie.title} {tmdb-${movie.tmdbId}}/${movie.title}.en.srt`,
    );

    const result = await getVfsSubtitleEntry(em, pathInfo);

    expect(result).toBeNull();
  });

  it("returns null for non-matching episode subtitle path", async ({ em }) => {
    const pathInfo = PathInfo.parse(
      "/shows/Test {tvdb-999999}/Season 01/s01e01.en.srt",
    );

    const result = await getVfsSubtitleEntry(em, pathInfo);

    expect(result).toBeNull();
  });
});

describe("getEntry", () => {
  it("returns a movie for single-movie path type", async ({
    seeders: { seedCompletedMovie },
    em,
  }) => {
    const { movie } = await seedCompletedMovie();
    const pathInfo = PathInfo.parse(
      `/movies/${movie.title} {tmdb-${movie.tmdbId}}/${movie.title}.mkv`,
    );

    const result = await getEntry(em, pathInfo);

    expect(result).not.toBeNull();
  });

  it("returns a show for show-seasons path type", async ({
    seeders: { seedCompletedShow },
    em,
  }) => {
    const { show } = await seedCompletedShow();
    const pathInfo = PathInfo.parse(
      `/shows/${show.title} {tvdb-${show.tvdbId}}`,
    );

    const result = await getEntry(em, pathInfo);

    expect(result).not.toBeNull();
  });

  it("returns a season for season-episodes path type", async ({
    seeders: { seedCompletedShow },
    em,
  }) => {
    const { show, seasons } = await seedCompletedShow();

    expect.assert(seasons[0]);

    const pathInfo = PathInfo.parse(
      `/shows/${show.title} {tvdb-${show.tvdbId}}/Season ${seasons[0].number.toString().padStart(2, "0")}`,
    );

    const result = await getEntry(em, pathInfo);

    expect(result).not.toBeNull();
  });

  it("returns an episode for single-episode path type", async ({
    seeders: { seedCompletedShow },
    em,
  }) => {
    const { show, episodes } = await seedCompletedShow();

    expect.assert(episodes[0]);

    const episode = episodes[0];
    const season = await episode.season.loadOrFail();

    const pathInfo = PathInfo.parse(
      `/shows/${show.title} {tvdb-${show.tvdbId}}/Season ${season.number.toString().padStart(2, "0")}/s${season.number.toString().padStart(2, "0")}e${episode.number.toString().padStart(2, "0")}.mkv`,
    );

    const result = await getEntry(em, pathInfo);

    expect(result).not.toBeNull();
  });

  it("throws TypeError for subtitle-file with no matching entry", async ({
    seeders: { seedCompletedMovie },
    em,
  }) => {
    const { movie } = await seedCompletedMovie();
    const pathInfo = PathInfo.parse(
      `/movies/${movie.title} {tmdb-${movie.tmdbId}}/${movie.title}.en.srt`,
    );

    await expect(getEntry(em, pathInfo)).rejects.toThrow(
      "Unable to find subtitle file",
    );
  });

  it("returns null for unknown path type", async ({ em }) => {
    const pathInfo = PathInfo.parse("/movies");

    const result = await getEntry(em, pathInfo);

    expect(result).toBeNull();
  });
});
