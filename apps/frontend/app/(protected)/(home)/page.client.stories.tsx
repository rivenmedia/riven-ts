import { ProtectedLayoutWrapper } from "@/.storybook/decorators/protected-layout-wrapper";
import { preview } from "@/.storybook/preview";

import { DateTime } from "luxon";
import { graphql, HttpResponse } from "msw";
import { expect, within } from "storybook/test";

import { GET_RECENTLY_ADDED } from "./_components/recently-added";
import { GET_TMDB_NOW_PLAYING } from "./_components/tmdb-now-playing";
import { GET_TRENDING_MOVIES } from "./_components/trending-movies";
import { GET_TRENDING_SHOWS } from "./_components/trending-shows";
import { HomePage } from "./page.client";

import type { UUID } from "node:crypto";

const meta = preview.meta({
  title: "Pages / Home",
  component: HomePage,
  parameters: {
    layout: "fullscreen",
    chromatic: {
      disableSnapshot: true,
    },
  },
  decorators: [ProtectedLayoutWrapper],
});

export const Default = meta.story({
  beforeEach({ msw }) {
    msw.use(
      graphql.query(GET_TMDB_NOW_PLAYING, () =>
        HttpResponse.json({
          data: {
            nowPlaying: [
              {
                __typename: "NowPlayingItem",
                id: crypto.randomUUID() as UUID,
                mediaType: "movie",
                title: "John Wick: Chapter 4",
                backdropPath:
                  "https://image.tmdb.org/t/p/original/i3OTGmLNOZIo4SRQLVfLjeWegB6.jpg",
                releaseDate: "2023-03-24",
                voteAverage: 7.8,
                originalLanguage: "en",
                overview:
                  "With the price on his head ever increasing, John Wick uncovers a path to defeating The High Table.",
                genres: [
                  {
                    __typename: "Genre",
                    id: crypto.randomUUID() as UUID,
                    name: "Action",
                  },
                  {
                    __typename: "Genre",
                    id: crypto.randomUUID() as UUID,
                    name: "Thriller",
                  },
                ],
                certification: "15",
                ratings: [
                  {
                    __typename: "Rating",
                    name: "imdb",
                    image: "imdb.svg",
                    score: "7.6",
                    url: "https://www.imdb.com/title/tt10366206/",
                  },
                  {
                    __typename: "Rating",
                    name: "rottentomatoes",
                    image: "rottentomatoes_certified_fresh.svg",
                    score: "94%",
                    url: "https://www.rottentomatoes.com/m/john_wick_chapter_4",
                  },
                ],
                logo: "https://image.tmdb.org/t/p/original/24dIhRKjLnYRanA2Mo0ycZfObUp.png",
              },
              {
                __typename: "NowPlayingItem",
                id: crypto.randomUUID() as UUID,
                mediaType: "show",
                title: "Arcane",
                backdropPath:
                  "https://image.tmdb.org/t/p/original/sYXLeu5usz6yEz0k00FYvtEdodD.jpg",
                releaseDate: "2024-11-09",
                voteAverage: 9.1,
                originalLanguage: "en",
                overview:
                  "Amid the stark discord of twin cities Piltover and Zaun, two sisters fight on rival sides of a war.",
                genres: [
                  {
                    __typename: "Genre",
                    id: crypto.randomUUID() as UUID,
                    name: "Animation",
                  },
                  {
                    __typename: "Genre",
                    id: crypto.randomUUID() as UUID,
                    name: "Action & Adventure",
                  },
                ],
                certification: "12A",
                ratings: [],
                logo: "https://image.tmdb.org/t/p/original/jXLNOzeEA8AoJy92dJTUUZXTMxK.png",
              },
              {
                __typename: "NowPlayingItem",
                id: crypto.randomUUID() as UUID,
                mediaType: "movie",
                title: "Insidious: Out of the Further",
                backdropPath:
                  "https://image.tmdb.org/t/p/original/hD8y787ciNWQ2bn396YrSsOIzdN.jpg",
                releaseDate: DateTime.fromObject({
                  year: 2026,
                  month: 8,
                  day: 21,
                }).toISO(),
                voteAverage: 6.5,
                originalLanguage: "en",
                overview:
                  "Gemma, a young mother raising her daughter in the house she grew up in, discovers she can travel into The Further, where she possesses an ability to bring what lives there back to the real world.",
                genres: [
                  {
                    __typename: "Genre",
                    id: crypto.randomUUID() as UUID,
                    name: "Horror",
                  },
                ],
                certification: "18",
                ratings: [],
                logo: "https://image.tmdb.org/t/p/original/iGjbP4jYzzbINDtd9kScypQOlmw.png",
              },
            ],
          },
        }),
      ),
      graphql.query(GET_TRENDING_MOVIES, ({ variables }) => {
        if (variables.timeWindow === "day") {
          return HttpResponse.json({
            data: {
              trendingMovies: [
                {
                  __typename: "Movie",
                  id: crypto.randomUUID() as UUID,
                  type: "movie",
                  title: "Avengers: Endgame",
                  posterPath:
                    "https://image.tmdb.org/t/p/original/ulzhLuWrPK07P1YkdWQLZnQh1JL.jpg",
                  year: 2019,
                },
              ],
            },
          });
        }

        return HttpResponse.json({
          data: {
            trendingMovies: [
              {
                __typename: "Movie",
                id: crypto.randomUUID() as UUID,
                type: "movie",
                title: "The Odyssey",
                posterPath:
                  "https://image.tmdb.org/t/p/original/5rhTDKUhPYvpdQIijFIs5VoWsON.jpg",
                year: 2026,
              },
            ],
          },
        });
      }),
      graphql.query(GET_TRENDING_SHOWS, ({ variables }) => {
        if (variables.timeWindow === "day") {
          return HttpResponse.json({
            data: {
              trendingShows: [
                {
                  __typename: "Show",
                  id: crypto.randomUUID() as UUID,
                  type: "show",
                  title: "Breaking Bad",
                  posterPath:
                    "https://artworks.thetvdb.com/banners/posters/81189-10.jpg",
                  year: 2008,
                },
              ],
            },
          });
        }

        return HttpResponse.json({
          data: {
            trendingShows: [
              {
                __typename: "Show",
                id: crypto.randomUUID() as UUID,
                type: "show",
                title: "Arcane",
                posterPath:
                  "https://artworks.thetvdb.com/banners/v4/series/371028/posters/617f6a8c59e8f.jpg",
                year: 2024,
              },
            ],
          },
        });
      }),
      graphql.query(GET_RECENTLY_ADDED, () =>
        HttpResponse.json({
          data: {
            recentlyAdded: [],
          },
        }),
      ),
    );
  },
});

Default.test(
  'Loads the correct items when the Trending Movies "This week" button is clicked',
  async ({ canvas, userEvent, step }) => {
    await step("View weekly trending movies", async () => {
      const trendingMoviesActions = await canvas.findByRole("region", {
        name: /trending movies/iu,
      });

      const thisWeekButton = await within(trendingMoviesActions).findByRole(
        "button",
        {
          name: /this week/iu,
        },
      );

      await userEvent.click(thisWeekButton);
    });

    const weeklyTrendingMovie = await canvas.findByRole("heading", {
      name: /the odyssey/iu,
    });

    await expect(weeklyTrendingMovie).toBeInTheDocument();
  },
);

Default.test(
  'Navigates to the Trending Movies page when the Trending Movies "View all" button is clicked',
  async ({ canvas }) => {
    const trendingMoviesActions = await canvas.findByRole("region", {
      name: /trending movies/iu,
    });

    const viewAllButton = await within(trendingMoviesActions).findByRole(
      "link",
      { name: /view all/iu },
    );

    await expect(viewAllButton).toHaveAttribute(
      "href",
      "/lists/trending/movies",
    );
  },
);

Default.test(
  'Loads the correct items when the Trending Shows "This week" button is clicked',
  async ({ canvas, userEvent, step }) => {
    await step("View weekly trending shows", async () => {
      const trendingShowsActions = await canvas.findByRole("region", {
        name: /trending tv shows/iu,
      });

      const thisWeekButton = await within(trendingShowsActions).findByRole(
        "button",
        {
          name: /this week/iu,
        },
      );

      await userEvent.click(thisWeekButton);
    });

    const weeklyTrendingShow = await canvas.findByRole("heading", {
      name: /arcane/iu,
    });

    await expect(weeklyTrendingShow).toBeInTheDocument();
  },
);

Default.test(
  'Navigates to the Trending Shows page when the Trending Shows "View all" button is clicked',
  async ({ canvas }) => {
    const trendingShowsActions = await canvas.findByRole("region", {
      name: /trending tv shows/iu,
    });

    const viewAllButton = await within(trendingShowsActions).findByRole(
      "link",
      { name: /view all/iu },
    );

    await expect(viewAllButton).toHaveAttribute(
      "href",
      "/lists/trending/shows",
    );
  },
);

export const WithRecentlyAdded = Default.extend({
  beforeEach({ msw }) {
    msw.use(
      graphql.query(GET_RECENTLY_ADDED, () =>
        HttpResponse.json({
          data: {
            recentlyAdded: [
              {
                __typename: "Show",
                id: "0000-0000-0000-0000-0004",
                type: "show",
                title: "Arcane",
                posterPath:
                  "https://artworks.thetvdb.com/banners/v4/series/371028/posters/617f6a8c59e8f.jpg",
                year: 2024,
              },
            ],
          },
        }),
      ),
    );
  },
});
