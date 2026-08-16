import { DateTime } from "luxon";
import { describe, expect } from "vitest";

import { it } from "../../__tests__/test-context.ts";

const indexedAt = DateTime.utc().toJSDate();
const pastReleaseDate = DateTime.utc().minus({ years: 1 }).toJSDate();

describe("onFlush", () => {
  describe("computing state from a movie's media state", () => {
    it("sets the item request state to 'processing' for an indexed movie", async ({
      seeders: { seedIndexedMovie },
    }) => {
      const { movie } = await seedIndexedMovie();

      await expect(movie.itemRequest.loadProperty("state")).resolves.toBe(
        "processing",
      );
    });

    it("sets the item request state to 'unreleased' for a movie that has not been released", async ({
      seeders: { seedUnreleasedMovie },
    }) => {
      const { movie } = await seedUnreleasedMovie();

      await expect(movie.itemRequest.loadProperty("state")).resolves.toBe(
        "unreleased",
      );
    });

    it("sets the item request state to 'completed' for a fully downloaded movie", async ({
      completedMovieContext: { completedMovie },
    }) => {
      await expect(
        completedMovie.itemRequest.loadProperty("state"),
      ).resolves.toBe("completed");
    });

    it("does not recompute the item request state when an unrelated field changes", async ({
      em,
      factories: { movieFactory },
    }) => {
      const movie = await movieFactory.createOne({
        releaseDate: pastReleaseDate,
        indexedAt,
      });

      const itemRequest = await movie.itemRequest.loadOrFail();

      itemRequest.state = "paused";
      movie.title = "A brand new title";

      await em.flush();

      expect(itemRequest.state).toBe("paused");
    });
  });

  describe("computing state from a show's media state", () => {
    it("sets the item request state to 'unreleased' for an upcoming show", async ({
      seeders: { seedUnreleasedShow },
    }) => {
      const { show } = await seedUnreleasedShow();

      await expect(show.itemRequest.loadProperty("state")).resolves.toBe(
        "unreleased",
      );
    });

    it("sets the item request state to 'ongoing' for a continuing show if the state is not 'unreleased'", async ({
      seeders: { seedOngoingShow },
    }) => {
      const { show } = await seedOngoingShow();

      await expect(show.itemRequest.loadProperty("state")).resolves.toBe(
        "ongoing",
      );
    });

    it("does not set the item request state to 'ongoing' for a continuing show if the state is 'unreleased'", async ({
      seeders: { seedUnreleasedShow },
    }) => {
      const { show } = await seedUnreleasedShow();

      await expect(show.itemRequest.loadProperty("state")).resolves.toBe(
        "unreleased",
      );
    });

    it("sets the item request state to 'processing' for an indexed show", async ({
      seeders: { seedIndexedShow },
    }) => {
      const { show } = await seedIndexedShow();

      await expect(show.itemRequest.loadProperty("state")).resolves.toBe(
        "processing",
      );
    });

    it("sets the item request state to 'processing' for a partially completed show with incomplete requested seasons", async ({
      seeders: { seedPartiallyCompletedShow },
    }) => {
      const { show } = await seedPartiallyCompletedShow();

      await expect(show.itemRequest.loadProperty("state")).resolves.toBe(
        "processing",
      );
    });

    it("sets the item request state to 'completed' for a fully completed show", async ({
      seeders: { seedCompletedShow },
    }) => {
      const { show } = await seedCompletedShow();

      await expect(show.itemRequest.loadProperty("state")).resolves.toBe(
        "completed",
      );
    });

    it("sets the item request state to 'completed' for a partially requested show with no incomplete requested seasons", async ({
      seeders: { seedPartiallyRequestedShow },
    }) => {
      const { show } = await seedPartiallyRequestedShow();

      await expect(show.itemRequest.loadProperty("state")).resolves.toBe(
        "completed",
      );
    });
  });

  describe("newly requested seasons", () => {
    it("sets the item request state to 'processing' when an indexed season becomes requested", async ({
      em,
      seeders: { seedPartiallyRequestedShow },
    }) => {
      const { show, seasons } = await seedPartiallyRequestedShow();

      const season = seasons?.find(({ isRequested }) => !isRequested);

      expect.assert(season);

      const itemRequest = await show.itemRequest.loadOrFail();

      season.isRequested = true;

      await em.persist(season).flush();

      expect(itemRequest.state).toBe("processing");
    });

    it("sets the item request state to 'processing' when multiple seasons of the same show are requested in a single flush", async ({
      em,
      seeders: { seedPartiallyRequestedShow },
    }) => {
      const { show, seasons } = await seedPartiallyRequestedShow();

      expect.assert(seasons);

      const [seasonA, seasonB] = seasons.filter(
        ({ isRequested }) => !isRequested,
      );

      expect.assert(seasonA);
      expect.assert(seasonB);

      seasonA.isRequested = true;
      seasonB.isRequested = true;

      await em.persist(seasonA).persist(seasonB).flush();

      await expect(show.itemRequest.loadProperty("state")).resolves.toBe(
        "processing",
      );
    });
  });
});

describe("beforeUpsert", () => {
  it("marks an ended show's item request state to 'completed' when it was ongoing and the show is now completed", async ({
    em,
    seeders: { seedCompletedOngoingShow },
  }) => {
    const { show } = await seedCompletedOngoingShow();

    show.status = "ended";

    await em.upsert(show);

    await expect(show.itemRequest.loadProperty("state")).resolves.toBe(
      "completed",
    );
  });

  it("marks an ended show's item request state to 'processing' when it was ongoing and the show is not yet completed", async ({
    em,
    factories: { showFactory },
  }) => {
    const show = await showFactory.createOne({
      status: "continuing",
      releaseDate: pastReleaseDate,
      indexedAt,
    });

    show.status = "ended";

    await em.upsert(show);

    await expect(show.itemRequest.loadProperty("state")).resolves.toBe(
      "processing",
    );
  });

  it("computes the item request's state normally for a movie", async ({
    em,
    seeders: { seedScrapedMovie },
  }) => {
    const { movie } = await seedScrapedMovie();

    await em.upsert(movie);

    await expect(movie.itemRequest.loadProperty("state")).resolves.toBe(
      "processing",
    );
  });

  it("throws when a movie is upserted in the partially_completed state", async ({
    em,
    factories: { movieFactory },
  }) => {
    const movie = await movieFactory.createOne({
      releaseDate: pastReleaseDate,
      indexedAt,
    });

    movie.state = "partially_completed";

    await expect(em.upsert(movie)).rejects.toThrow(
      /movie entity should not be in a partially completed state/iu,
    );
  });
});
