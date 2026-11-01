import { HttpResponse, http } from "msw";
import { expect } from "vitest";

import { findByIdHandler } from "../../__generated__/handlers/findByIdHandler.ts";
import { tvEpisodeCreditsHandler } from "../../__generated__/handlers/tvEpisodeCreditsHandler.ts";
import { it } from "../../__tests__/tmdb.test-context.ts";
import { TmdbAPI } from "../../datasource/tmdb.datasource.ts";
import { getEpisodeCast } from "../get-indexer-cast.ts";

const castMember = (id: number, name: string, character: string) => ({
  id,
  name,
  character,
  profile_path: `/${name.toLowerCase().replaceAll(" ", "-")}.jpg`,
  order: id,
});

function createEpisode() {
  return {
    id: "349232",
    rootId: "81189",
    seasonNumber: 1,
    number: 1,
  };
}

it.describe(getEpisodeCast, () => {
  it("returns the episode's cast followed by its guest stars, using TMDB's numbering", async ({
    server,
    dataSourceMap,
  }) => {
    server.use(
      findByIdHandler({
        tv_results: [],
        tv_episode_results: [
          { show_id: 1396, season_number: 1, episode_number: 2 },
        ],
      }),
      tvEpisodeCreditsHandler(({ params }) => {
        if (
          params["series_id"] !== "1396" ||
          params["season_number"] !== "1" ||
          params["episode_number"] !== "2"
        ) {
          return HttpResponse.json(null, { status: 404 });
        }

        return HttpResponse.json({
          id: 62_085,
          cast: [
            castMember(2, "Aaron Paul", "Jesse Pinkman"),
            castMember(1, "Bryan Cranston", "Walter White"),
          ],
          guest_stars: [
            castMember(3, "John Koyama", "Emilio Koyama"),
            // Guest stars who are also in the main cast are only listed once
            castMember(1, "Bryan Cranston", "Walter White"),
          ],
        });
      }),
    );

    const cast = await getEpisodeCast(
      dataSourceMap.get(TmdbAPI),
      createEpisode(),
      "en-US",
    );

    expect(cast?.map(({ name }) => name)).toStrictEqual([
      "Bryan Cranston",
      "Aaron Paul",
      "John Koyama",
    ]);
  });

  it("falls back to the show and episode numbers if TMDB doesn't have the episode's TVDB ID", async ({
    server,
    dataSourceMap,
  }) => {
    const episode = createEpisode();

    server.use(
      http.get("https://api.themoviedb.org/3/find/:externalId", ({ params }) =>
        HttpResponse.json(
          params["externalId"] === episode.rootId
            ? { tv_results: [{ id: 1396 }], tv_episode_results: [] }
            : { tv_results: [], tv_episode_results: [] },
        ),
      ),
      tvEpisodeCreditsHandler(({ params }) => {
        if (
          params["series_id"] !== "1396" ||
          params["season_number"] !== "1" ||
          params["episode_number"] !== "1"
        ) {
          return HttpResponse.json(null, { status: 404 });
        }

        return HttpResponse.json({
          id: 62_085,
          cast: [castMember(1, "Bryan Cranston", "Walter White")],
          guest_stars: [],
        });
      }),
    );

    const cast = await getEpisodeCast(
      dataSourceMap.get(TmdbAPI),
      episode,
      "en-US",
    );

    expect(cast).toStrictEqual([
      {
        id: "1",
        name: "Bryan Cranston",
        character: "Walter White",
        profileUrl: "https://image.tmdb.org/t/p/w185/bryan-cranston.jpg",
      },
    ]);
  });

  it("returns null if the episode has no cast", async ({
    server,
    dataSourceMap,
  }) => {
    server.use(
      findByIdHandler({
        tv_results: [],
        tv_episode_results: [
          { show_id: 1396, season_number: 1, episode_number: 1 },
        ],
      }),
      tvEpisodeCreditsHandler(() =>
        HttpResponse.json({ id: 62_085, cast: [], guest_stars: [] }),
      ),
    );

    const cast = await getEpisodeCast(
      dataSourceMap.get(TmdbAPI),
      createEpisode(),
      "en-US",
    );

    expect(cast).toBeNull();
  });
});
