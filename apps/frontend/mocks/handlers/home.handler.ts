import { journeyFixtures } from "@repo/util-e2e";

import { DateTime } from "luxon";
import { HttpResponse } from "msw/http";

import { GET_RECENTLY_ADDED } from "#app/(protected)/(home)/_components/recently-added/_queries/get-recently-added.query.ts";
import { GET_TMDB_NOW_PLAYING } from "#app/(protected)/(home)/_components/tmdb-now-playing/_queries/get-tmdb-now-playing.query.ts";
import { GET_TMDB_TRENDING_MOVIES } from "#app/(protected)/(home)/_components/tmdb-trending-movies/_queries/get-tmdb-trending-movies.ts";
import { GET_TMDB_TRENDING_SHOWS } from "#app/(protected)/(home)/_components/tmdb-trending-shows/_queries/get-tmdb-trending-shows.ts";
import { api } from "#mocks/graphql.ts";

import type { GetRecentlyAddedQuery } from "#app/(protected)/(home)/_components/recently-added/_queries/get-recently-added.query.typegen.ts";
import type { GetTmdbNowPlayingQuery } from "#app/(protected)/(home)/_components/tmdb-now-playing/_queries/get-tmdb-now-playing.query.typegen.ts";
import type { GetTmdbTrendingMoviesQuery } from "#app/(protected)/(home)/_components/tmdb-trending-movies/_queries/get-tmdb-trending-movies.typegen.ts";
import type { GetTmdbTrendingShowsQuery } from "#app/(protected)/(home)/_components/tmdb-trending-shows/_queries/get-tmdb-trending-shows.typegen.ts";
import type { TmdbTrendingTimeWindow } from "#app/_types/__generated__/graphql.ts";

const { home } = journeyFixtures;

/** The year of a TMDB `YYYY-MM-DD` date */
const yearOf = (date: string) => DateTime.fromISO(date).year;

export const nowPlaying = [
  {
    __typename: "TmdbIndexerData",
    id: home.nowPlaying.tmdbId.toString(),
    type: "movie",
    title: home.nowPlaying.title,
    backdropUrl:
      "https://image.tmdb.org/t/p/original/i3OTGmLNOZIo4SRQLVfLjeWegB6.jpg",
    releaseDate: DateTime.fromISO(home.nowPlaying.releaseDate).toISO(),
    voteAverage: 7.8,
    language: "en",
    overview: `The overview of ${home.nowPlaying.title}.`,
    genres: [
      { __typename: "Genre", id: "28", name: "Action" },
      { __typename: "Genre", id: "53", name: "Thriller" },
    ],
    certification: null,
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
      url: "https://image.tmdb.org/t/p/original/24dIhRKjLnYRanA2Mo0ycZfObUp.png",
    },
    seasonLabel: "Spring 2023",
  },
  {
    __typename: "TmdbIndexerData",
    id: "1149104",
    type: "movie",
    title: "Insidious: Out of the Further",
    backdropUrl:
      "https://image.tmdb.org/t/p/original/hD8y787ciNWQ2bn396YrSsOIzdN.jpg",
    releaseDate: DateTime.fromObject({ year: 2026, month: 8, day: 21 }).toISO(),
    voteAverage: 7.8,
    language: "en",
    overview: "The overview of Insidious: Out of the Further.",
    genres: [
      { __typename: "Genre", id: "28", name: "Action" },
      { __typename: "Genre", id: "53", name: "Thriller" },
    ],
    certification: null,
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
] as const satisfies GetTmdbNowPlayingQuery["tmdbNowPlaying"];

export const trendingMovies = {
  day: [
    {
      __typename: "TmdbIndexerData",
      id: home.trendingMoviesToday.tmdbId.toString(),
      type: "movie",
      title: home.trendingMoviesToday.title,
      posterUrl:
        "https://image.tmdb.org/t/p/original/ulzhLuWrPK07P1YkdWQLZnQh1JL.jpg",
      year: yearOf(home.trendingMoviesToday.releaseDate),
    },
  ],
  week: [
    {
      __typename: "TmdbIndexerData",
      id: home.trendingMoviesThisWeek.tmdbId.toString(),
      type: "movie",
      title: home.trendingMoviesThisWeek.title,
      posterUrl:
        "https://image.tmdb.org/t/p/original/5rhTDKUhPYvpdQIijFIs5VoWsON.jpg",
      year: yearOf(home.trendingMoviesThisWeek.releaseDate),
    },
  ],
} as const satisfies Record<
  TmdbTrendingTimeWindow,
  GetTmdbTrendingMoviesQuery["tmdbTrendingMovies"]
>;

export const trendingShows = {
  day: [
    {
      __typename: "TmdbIndexerData",
      id: home.trendingShows.today.tvdbId.toString(),
      type: "show",
      title: home.trendingShows.today.title,
      posterUrl: "https://artworks.thetvdb.com/banners/posters/81189-10.jpg",
      year: yearOf(home.trendingShows.today.firstAirDate),
      isRequestable: true,
    },
  ],
  week: [
    {
      __typename: "TmdbIndexerData",
      id: home.trendingShows.thisWeek.tvdbId.toString(),
      type: "show",
      title: home.trendingShows.thisWeek.title,
      posterUrl:
        "https://artworks.thetvdb.com/banners/v4/series/371028/posters/617f6a8c59e8f.jpg",
      year: yearOf(home.trendingShows.thisWeek.firstAirDate),
      isRequestable: true,
    },
  ],
} as const satisfies Record<
  TmdbTrendingTimeWindow,
  GetTmdbTrendingShowsQuery["tmdbTrendingShows"]
>;

export const recentlyAdded = [
  {
    __typename: "Show",
    id: "0000-0000-0000-0000-0004",
    type: "show",
    title: "Arcane",
    posterPath:
      "https://artworks.thetvdb.com/banners/v4/series/371028/posters/617f6a8c59e8f.jpg",
    year: 2024,
  },
] as const satisfies GetRecentlyAddedQuery["recentlyAdded"];

export const createTmdbNowPlayingHandler = (
  items: GetTmdbNowPlayingQuery["tmdbNowPlaying"] = nowPlaying,
) =>
  api.query(GET_TMDB_NOW_PLAYING, () =>
    HttpResponse.json({ data: { tmdbNowPlaying: items } }),
  );

export const createTmdbTrendingMoviesHandler = (
  items: Record<
    TmdbTrendingTimeWindow,
    GetTmdbTrendingMoviesQuery["tmdbTrendingMovies"]
  > = trendingMovies,
) =>
  api.query(GET_TMDB_TRENDING_MOVIES, ({ variables }) =>
    HttpResponse.json({
      data: { tmdbTrendingMovies: items[variables.timeWindow] },
    }),
  );

export const createTmdbTrendingShowsHandler = (
  items: Record<
    TmdbTrendingTimeWindow,
    GetTmdbTrendingShowsQuery["tmdbTrendingShows"]
  > = trendingShows,
) =>
  api.query(GET_TMDB_TRENDING_SHOWS, ({ variables }) =>
    HttpResponse.json({
      data: { tmdbTrendingShows: items[variables.timeWindow] },
    }),
  );

export const createRecentlyAddedHandler = (
  items: GetRecentlyAddedQuery["recentlyAdded"] = recentlyAdded,
) =>
  api.query(GET_RECENTLY_ADDED, () =>
    HttpResponse.json({ data: { recentlyAdded: items } }),
  );
