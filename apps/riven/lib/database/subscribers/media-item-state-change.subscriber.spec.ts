import { Movie } from "@repo/util-plugin-sdk/dto/entities";

import { DateTime } from "luxon";
import { describe, expect, vi } from "vitest";

import { it as baseIt } from "#__tests__/test-context.ts";
import { pubSub } from "#graphql/pubsub.ts";

import type { Episode } from "@repo/util-plugin-sdk/dto/entities";
import type { MockInstance } from "vitest";

const indexedAt = DateTime.utc().toJSDate();
const pastReleaseDate = DateTime.utc().minus({ years: 1 }).toJSDate();

const it = baseIt.extend(
  "seasonContext",
  async ({
    em,
    factories: {
      showFactory,
      seasonFactory,
      episodeFactory,
      mediaEntryFactory,
    },
  }) => {
    const show = await showFactory.createOne({
      status: "ended",
      releaseDate: pastReleaseDate,
      indexedAt,
    });

    const season = await seasonFactory.createOne({
      show,
      itemRequest: show.itemRequest,
      releaseDate: pastReleaseDate,
      indexedAt,
    });

    const episodes = await episodeFactory
      .each((entity, i) => {
        entity.absoluteNumber = i + 1;
        entity.number = i + 1;
      })
      .create(3, {
        season,
        show,
        itemRequest: show.itemRequest,
        isSpecial: false,
        isRequested: true,
        releaseDate: pastReleaseDate,
        indexedAt,
      });

    const completeEpisode = async (episode: Episode) => {
      episode.filesystemEntries.add(
        mediaEntryFactory.makeOne({ mediaItem: episode }),
      );

      await em.flush();
    };

    return { season, episodes, completeEpisode };
  },
);

const getPublishedCalls = (
  publishSpy: MockInstance<typeof pubSub.publish>,
  topic: Parameters<typeof pubSub.publish>[0],
) => publishSpy.mock.calls.filter(([calledTopic]) => calledTopic === topic);

describe("media item state changes", () => {
  it("publishes the ID of a media item whose state changes", async ({
    em,
    factories: { streamFactory },
    seeders: { seedIndexedMovie },
  }) => {
    const { movie } = await seedIndexedMovie();

    const publishSpy = vi.spyOn(pubSub, "publish");

    movie.streams.add(await streamFactory.createOne());

    await em.persist(movie).flush();

    expect(
      getPublishedCalls(publishSpy, "MEDIA_ITEM_STATE_CHANGED"),
    ).toStrictEqual([["MEDIA_ITEM_STATE_CHANGED", movie.id, movie.id]]);
  });

  it("does not publish until the transaction has committed", async ({
    em,
    seeders: { seedIndexedMovie },
  }) => {
    const { movie } = await seedIndexedMovie();

    const publishSpy = vi.spyOn(pubSub, "publish");

    await em.transactional(async (transactionEm) => {
      const transactionMovie = await transactionEm.findOneOrFail(
        Movie,
        movie.id,
      );

      transactionMovie.state = "paused";

      await transactionEm.flush();

      expect(publishSpy).not.toHaveBeenCalled();
    });

    expect(
      getPublishedCalls(publishSpy, "MEDIA_ITEM_STATE_CHANGED"),
    ).toStrictEqual([["MEDIA_ITEM_STATE_CHANGED", movie.id, movie.id]]);
  });

  it("does not publish when the transaction is rolled back", async ({
    em,
    seeders: { seedIndexedMovie },
  }) => {
    const { movie } = await seedIndexedMovie();

    const publishSpy = vi.spyOn(pubSub, "publish");

    await expect(
      em.transactional(async (transactionEm) => {
        const transactionMovie = await transactionEm.findOneOrFail(
          Movie,
          movie.id,
        );

        transactionMovie.state = "paused";

        await transactionEm.flush();

        throw new Error("Rollback");
      }),
    ).rejects.toThrow("Rollback");

    expect(publishSpy).not.toHaveBeenCalled();
  });
});

describe("season updates", () => {
  it("publishes once when both an episode and its season change state in the same flush", async ({
    seasonContext: {
      season,
      episodes: [episode],
      completeEpisode,
    },
  }) => {
    expect.assert(episode);

    const publishSpy = vi.spyOn(pubSub, "publish");

    await completeEpisode(episode);

    expect(season.state).toBe("partially_completed");
    expect(getPublishedCalls(publishSpy, "SEASON_UPDATED")).toStrictEqual([
      ["SEASON_UPDATED", season.id, season.id],
    ]);
  });

  it("publishes when an episode changes state without changing its season's state", async ({
    seasonContext: {
      season,
      episodes: [firstEpisode, secondEpisode],
      completeEpisode,
    },
  }) => {
    expect.assert(firstEpisode);
    expect.assert(secondEpisode);

    await completeEpisode(firstEpisode);

    expect(season.state).toBe("partially_completed");

    const publishSpy = vi.spyOn(pubSub, "publish");

    await completeEpisode(secondEpisode);

    expect(season.state).toBe("partially_completed");
    expect(getPublishedCalls(publishSpy, "SEASON_UPDATED")).toStrictEqual([
      ["SEASON_UPDATED", season.id, season.id],
    ]);
  });
});
