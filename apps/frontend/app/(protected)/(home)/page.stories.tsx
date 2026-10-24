import { DateTime } from "luxon";
import { HttpResponse } from "msw";
import { expect, within } from "storybook/test";

import { preview } from "#.storybook/preview.tsx";
import { GET_RECENTLY_ADDED } from "#app/(protected)/(home)/_components/recently-added.tsx";
import { GET_TMDB_NOW_PLAYING } from "#app/(protected)/(home)/_components/tmdb-now-playing/_queries/get-tmdb-now-playing.query.ts";
import { GET_TMDB_TRENDING_MOVIES } from "#app/(protected)/(home)/_components/tmdb-trending-movies/_queries/get-tmdb-trending-movies.ts";
import { GET_TMDB_TRENDING_SHOWS } from "#app/(protected)/(home)/_components/tmdb-trending-shows/_queries/get-tmdb-trending-shows.ts";
import HomePage from "#app/(protected)/(home)/page.tsx";
import { api } from "#mocks/graphql.ts";

const meta = preview.meta({
  title: "Pages / Home",
  component: HomePage,
  parameters: {
    layout: "fullscreen",
  },
});

export const Default = meta.story({
  beforeEach({ msw }) {
    msw.use(
      api.query(GET_TMDB_NOW_PLAYING, () =>
        HttpResponse.json({
          data: {
            tmdbNowPlaying: [
              {
                __typename: "TmdbIndexerData",
                id: crypto.randomUUID(),
                type: "movie",
                title: "John Wick: Chapter 4",
                backdropUrl:
                  "https://image.tmdb.org/t/p/original/i3OTGmLNOZIo4SRQLVfLjeWegB6.jpg",
                releaseDate: DateTime.fromObject({
                  year: 2023,
                  month: 3,
                  day: 24,
                }).toISO(),
                voteAverage: 7.8,
                language: "en",
                overview:
                  "With the price on his head ever increasing, John Wick uncovers a path to defeating The High Table.",
                genres: [
                  {
                    __typename: "Genre",
                    id: crypto.randomUUID(),
                    name: "Action",
                  },
                  {
                    __typename: "Genre",
                    id: crypto.randomUUID(),
                    name: "Thriller",
                  },
                ],
                certification: "15",
                ratings: {
                  __typename: "Ratings",
                  imdb: {
                    __typename: "Rating",
                    logo: "imdb.svg",
                    score: "7.6",
                    url: "https://www.imdb.com/title/tt10366206/",
                  },
                  rottenTomatoes: {
                    __typename: "Rating",
                    logo: "rottentomatoes_certified_fresh.svg",
                    score: "94%",
                    url: "https://www.rottentomatoes.com/m/john_wick_chapter_4",
                  },
                  tmdb: {
                    __typename: "Rating",
                    logo: "tmdb.svg",
                    score: "77%",
                    url: "https://www.themoviedb.org/movie/603692-john-wick-chapter-4",
                  },
                },
                logo: {
                  __typename: "ItemImage",
                  aspectRatio: 2 / 3,
                  height: 600,
                  width: 400,
                  url: "https://image.tmdb.org/t/p/original/24dIhRKjLnYRanA2Mo0ycZfObUp.png",
                },
                seasonLabel: "Spring 2023",
              },
              {
                __typename: "TmdbIndexerData",
                id: crypto.randomUUID(),
                type: "show",
                title: "Arcane",
                backdropUrl:
                  "https://image.tmdb.org/t/p/original/sYXLeu5usz6yEz0k00FYvtEdodD.jpg",
                releaseDate: DateTime.fromObject({
                  year: 2024,
                  month: 11,
                  day: 9,
                }).toISO(),
                voteAverage: 9.1,
                language: "en",
                overview:
                  "Amid the stark discord of twin cities Piltover and Zaun, two sisters fight on rival sides of a war.",
                genres: [
                  {
                    __typename: "Genre",
                    id: crypto.randomUUID(),
                    name: "Animation",
                  },
                  {
                    __typename: "Genre",
                    id: crypto.randomUUID(),
                    name: "Action & Adventure",
                  },
                ],
                certification: "12A",
                ratings: {
                  __typename: "Ratings",
                  imdb: null,
                  rottenTomatoes: null,
                  tmdb: null,
                },
                logo: {
                  __typename: "ItemImage",
                  aspectRatio: 2 / 3,
                  height: 600,
                  width: 400,
                  url: "https://image.tmdb.org/t/p/original/jXLNOzeEA8AoJy92dJTUUZXTMxK.png",
                },
                seasonLabel: "Fall 2024",
              },
              {
                __typename: "TmdbIndexerData",
                id: crypto.randomUUID(),
                type: "movie",
                title: "Insidious: Out of the Further",
                backdropUrl:
                  "https://image.tmdb.org/t/p/original/hD8y787ciNWQ2bn396YrSsOIzdN.jpg",
                releaseDate: DateTime.fromObject({
                  year: 2026,
                  month: 8,
                  day: 21,
                }).toISO(),
                voteAverage: 6.5,
                language: "en",
                overview:
                  "Gemma, a young mother raising her daughter in the house she grew up in, discovers she can travel into The Further, where she possesses an ability to bring what lives there back to the real world.",
                genres: [
                  {
                    __typename: "Genre",
                    id: crypto.randomUUID(),
                    name: "Horror",
                  },
                ],
                certification: "18",
                ratings: {
                  __typename: "Ratings",
                  imdb: null,
                  rottenTomatoes: null,
                  tmdb: null,
                },
                logo: {
                  __typename: "ItemImage",
                  aspectRatio: 2 / 3,
                  height: 600,
                  width: 400,
                  url: "https://image.tmdb.org/t/p/original/iGjbP4jYzzbINDtd9kScypQOlmw.png",
                },
                seasonLabel: "Summer 2026",
              },
            ],
          },
        }),
      ),
      api.query(GET_TMDB_TRENDING_MOVIES, ({ variables }) => {
        if (variables.timeWindow === "day") {
          return HttpResponse.json({
            data: {
              tmdbTrendingMovies: [
                {
                  __typename: "TmdbIndexerData",
                  id: crypto.randomUUID(),
                  type: "movie",
                  title: "Avengers: Endgame",
                  posterUrl:
                    "https://image.tmdb.org/t/p/original/ulzhLuWrPK07P1YkdWQLZnQh1JL.jpg",
                  year: 2019,
                },
              ],
            },
          });
        }

        return HttpResponse.json({
          data: {
            tmdbTrendingMovies: [
              {
                __typename: "TmdbIndexerData",
                id: crypto.randomUUID(),
                type: "movie",
                title: "The Odyssey",
                posterUrl:
                  "https://image.tmdb.org/t/p/original/5rhTDKUhPYvpdQIijFIs5VoWsON.jpg",
                year: 2026,
              },
            ],
          },
        });
      }),
      api.query(GET_TMDB_TRENDING_SHOWS, ({ variables }) => {
        if (variables.timeWindow === "day") {
          return HttpResponse.json({
            data: {
              tmdbTrendingShows: [
                {
                  __typename: "TmdbIndexerData",
                  id: crypto.randomUUID(),
                  type: "show",
                  title: "Breaking Bad",
                  posterUrl:
                    "https://artworks.thetvdb.com/banners/posters/81189-10.jpg",
                  year: 2008,
                  isRequestable: true,
                },
              ],
            },
          });
        }

        return HttpResponse.json({
          data: {
            tmdbTrendingShows: [
              {
                __typename: "TmdbIndexerData",
                id: crypto.randomUUID(),
                type: "show",
                title: "Arcane",
                posterUrl:
                  "https://artworks.thetvdb.com/banners/v4/series/371028/posters/617f6a8c59e8f.jpg",
                year: 2024,
                isRequestable: true,
              },
            ],
          },
        });
      }),
      api.query(GET_RECENTLY_ADDED, () =>
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
        name: /trending movies actions/iu,
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
      name: /trending movies actions/iu,
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
        name: /trending tv shows actions/iu,
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
      name: /trending tv shows actions/iu,
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
      api.query(GET_RECENTLY_ADDED, () =>
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
