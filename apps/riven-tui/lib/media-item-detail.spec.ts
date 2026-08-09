import { describe, expect, it } from "vitest";

import {
  buildEpisodeDetail,
  buildMovieDetail,
  buildSeasonDetail,
  buildShowDetail,
} from "./__tests__/fixtures.ts";
import { getChildren, getContentRating } from "./media-item-detail.ts";

const SEASON_ID = "00000000-0000-0000-0000-000000000001";
const EPISODE_ID = "00000000-0000-0000-0000-000000000002";

describe(getChildren, () => {
  it("maps a show's seasons to child items", () => {
    const show = buildShowDetail({
      seasons: [
        {
          __typename: "Season",
          id: SEASON_ID,
          title: "Season 1",
          number: 1,
          state: "completed",
          totalEpisodes: 10,
        },
      ],
    });

    expect(getChildren(show)).toStrictEqual([
      {
        id: SEASON_ID,
        number: 1,
        state: "completed",
        title: "Season 1",
        type: "Season",
      },
    ]);
  });

  it("maps a season's episodes to child items", () => {
    const season = buildSeasonDetail({
      episodes: [
        {
          __typename: "Episode",
          id: EPISODE_ID,
          title: "Episode 1",
          number: 1,
          state: "downloaded",
        },
      ],
    });

    expect(getChildren(season)).toStrictEqual([
      {
        id: EPISODE_ID,
        number: 1,
        state: "downloaded",
        title: "Episode 1",
        type: "Episode",
      },
    ]);
  });

  it("returns no children for a movie", () => {
    expect(getChildren(buildMovieDetail())).toStrictEqual([]);
  });

  it("returns no children for an episode", () => {
    expect(getChildren(buildEpisodeDetail())).toStrictEqual([]);
  });
});

describe(getContentRating, () => {
  it("reads the movie content rating for a movie", () => {
    expect(
      getContentRating(buildMovieDetail({ movieContentRating: "R" })),
    ).toBe("R");
  });

  it("reads the show content rating for a show, season, or episode", () => {
    expect(
      getContentRating(buildShowDetail({ showContentRating: "TV_MA" })),
    ).toBe("TV_MA");
    expect(
      getContentRating(buildSeasonDetail({ showContentRating: "TV_MA" })),
    ).toBe("TV_MA");
    expect(
      getContentRating(buildEpisodeDetail({ showContentRating: "TV_MA" })),
    ).toBe("TV_MA");
  });
});
