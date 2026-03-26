import { MediaEntry, Movie } from "@repo/util-plugin-sdk/dto/entities";

import { expect, vi } from "vitest";

import { rivenTestContext as it } from "../../__tests__/test-context.ts";
import { readDirSync } from "./readdir.ts";

it("returns persistent directory entries for the root path", async () => {
  const callback = vi.fn();

  readDirSync("/", callback);

  await vi.waitFor(() => {
    expect(callback).toHaveBeenCalledWith<[number, string[]]>(0, [
      "movies",
      "shows",
    ]);
  });
});

it("returns all shows for the /shows path", async ({ completedShow }) => {
  const callback = vi.fn();

  readDirSync("/shows", callback);

  await vi.waitFor(() => {
    expect(callback).toHaveBeenCalledWith<[number, string[]]>(0, [
      completedShow.getPrettyName(),
    ]);
  });
});

it('does not return entries for the "all shows" path for shows that do not have any episodes with a media entry', async ({
  seeders: { seedScrapedShow },
}) => {
  await seedScrapedShow();

  const callback = vi.fn();

  readDirSync("/shows", callback);

  await vi.waitFor(() => {
    expect(callback).toHaveBeenCalledWith<[number, string[]]>(0, []);
  });
});

it("returns all movies for the /movies path", async ({
  em,
  seeders: { seedCompletedMovie },
}) => {
  await seedCompletedMovie(3);

  const callback = vi.fn();

  readDirSync("/movies", callback);

  const movies = await em.findAll(Movie);

  await vi.waitFor(() => {
    expect(callback).toHaveBeenCalledWith<[number, unknown[]]>(
      0,
      movies.map((movie) => movie.getPrettyName()),
    );
  });
});

it("returns all seasons for a single show path", async ({ completedShow }) => {
  await completedShow.seasons.load();

  const callback = vi.fn();

  readDirSync(`/shows/${completedShow.getPrettyName()}`, callback);

  await vi.waitFor(() => {
    expect(callback).toHaveBeenCalledWith<[number, string[]]>(
      0,
      completedShow.seasons.map((season) => season.getPrettyName()),
    );
  });
});

it("does not return entries for a season that does not have any episodes with a media entry", async ({
  em,
  completedShow,
}) => {
  await em.nativeDelete(MediaEntry, {
    mediaItem: {
      type: "episode",
      season: {
        number: {
          $nin: [1],
        },
      },
    },
  });

  const callback = vi.fn();

  readDirSync(`/shows/${completedShow.getPrettyName()}`, callback);

  await vi.waitFor(() => {
    expect(callback).toHaveBeenCalledWith<[number, string[]]>(0, ["Season 01"]);
  });
});

it("returns all episodes for a single season path", async ({
  em,
  completedShow,
}) => {
  await completedShow.seasons.load();

  const seasonNumber = 1;
  const mediaEntries = await em.find(
    MediaEntry,
    {
      mediaItem: {
        type: "episode",
        season: {
          number: seasonNumber,
        },
      },
    },
    { populate: ["mediaItem"] },
  );

  const callback = vi.fn();

  readDirSync(
    `/shows/${completedShow.getPrettyName()}/Season ${seasonNumber.toString().padStart(2, "0")}`,
    callback,
  );

  await vi.waitFor(async () => {
    expect(callback).toHaveBeenCalledWith<[number, string[]]>(
      0,
      await Promise.all(mediaEntries.map((entry) => entry.getVfsFileName())),
    );
  });
});

it("does not return entries for episodes that does not have a media entry when viewing a season path", async ({
  em,
  completedShow,
}) => {
  await em.nativeDelete(MediaEntry, {
    mediaItem: {
      type: "episode",
      number: {
        $nin: [1],
      },
    },
  });

  const mediaEntry = await em.findOneOrFail(
    MediaEntry,
    {
      mediaItem: {
        type: "episode",
        number: 1,
      },
    },
    { populate: ["mediaItem"] },
  );

  const callback = vi.fn();

  readDirSync(`/shows/${completedShow.getPrettyName()}/Season 01`, callback);

  await vi.waitFor(async () => {
    expect(callback).toHaveBeenCalledWith<[number, string[]]>(0, [
      await mediaEntry.getVfsFileName(),
    ]);
  });
});

it("returns the media entry's filename when viewing a single movie's directory", async ({
  completedMovie,
}) => {
  const callback = vi.fn();

  const mediaEntries = await completedMovie.getMediaEntries();

  readDirSync(`/movies/${completedMovie.getPrettyName()}`, callback);

  await vi.waitFor(async () => {
    expect.assert(mediaEntries[0]);

    expect(callback).toHaveBeenCalledWith<[number, string[]]>(0, [
      await mediaEntries[0].getVfsFileName(),
    ]);
  });
});

it('does not return entries for the "all movies" path when a movie does not have a media entry', async ({
  completedMovie,
  seeders: { seedScrapedMovie },
}) => {
  await seedScrapedMovie(2);

  const callback = vi.fn();

  readDirSync("/movies", callback);

  await vi.waitFor(() => {
    expect(callback).toHaveBeenCalledWith<[number, string[]]>(0, [
      completedMovie.getPrettyName(),
    ]);
  });
});
