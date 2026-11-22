import { journeyFixtures } from "@repo/util-e2e";

import { HttpResponse, http } from "msw/http";

const {
  nowPlaying,
  trendingMoviesToday,
  trendingMoviesThisWeek,
  trendingShows,
} = journeyFixtures.home;

interface Movie {
  tmdbId: number;
  title: string;
  releaseDate: string;
}

type Show = (typeof trendingShows)[keyof typeof trendingShows];

/** Image paths with local copies in the frontend's `mocks/remote-assets`, so `next/image` can serve them */
interface Images {
  poster: string | null;
  backdrop: string | null;
}

/** TMDB's movie list item, as its now playing and trending lists return it */
const toMovieListItem = (
  { tmdbId, title, releaseDate }: Movie,
  { poster, backdrop }: Images,
) => ({
  adult: false,
  id: tmdbId,
  title,
  original_title: title,
  original_language: "en",
  // Riven drops list items without an overview
  overview: `The overview of ${title}.`,
  backdrop_path: backdrop,
  poster_path: poster,
  genre_ids: [28, 53],
  release_date: releaseDate,
  vote_average: 7.8,
  vote_count: 1000,
  popularity: 100,
  video: false,
});

/** TMDB's show list item, as its trending list returns it */
const toShowListItem = (
  { tmdbId, title, firstAirDate }: Show,
  { poster, backdrop }: Images,
) => ({
  id: tmdbId,
  name: title,
  overview: `The overview of ${title}.`,
  backdrop_path: backdrop,
  poster_path: poster,
  original_language: "en",
  genre_ids: [16, 10_759],
  first_air_date: firstAirDate,
  origin_country: ["US"],
});

const page = <T>(results: T[]) => ({
  page: 1,
  results,
  total_pages: 1,
  total_results: results.length,
});

const trendingMovies = {
  day: toMovieListItem(trendingMoviesToday, {
    poster: "/ulzhLuWrPK07P1YkdWQLZnQh1JL.jpg",
    backdrop: null,
  }),
  week: toMovieListItem(trendingMoviesThisWeek, {
    poster: "/5rhTDKUhPYvpdQIijFIs5VoWsON.jpg",
    backdrop: null,
  }),
};

const trendingShowsByTimeWindow = {
  day: toShowListItem(trendingShows.today, { poster: null, backdrop: null }),
  week: toShowListItem(trendingShows.thisWeek, {
    poster: "/sYXLeu5usz6yEz0k00FYvtEdodD.jpg",
    backdrop: "/sYXLeu5usz6yEz0k00FYvtEdodD.jpg",
  }),
};

type TimeWindow = keyof typeof trendingMovies;

const isTimeWindow = (value: unknown): value is TimeWindow =>
  value === "day" || value === "week";

/** TMDB's answers to the home page's lists, which show `journeyFixtures.home` */
export const tmdbHomeHandlers = [
  http.get("https://api.themoviedb.org/3/movie/now_playing", () =>
    HttpResponse.json(
      page([
        toMovieListItem(nowPlaying, {
          poster: "/ulzhLuWrPK07P1YkdWQLZnQh1JL.jpg",
          backdrop: "/i3OTGmLNOZIo4SRQLVfLjeWegB6.jpg",
        }),
        // The now playing carousel's autoplay throws with a single slide
        toMovieListItem(
          {
            tmdbId: 1_149_104,
            title: "Insidious: Out of the Further",
            releaseDate: "2026-08-21",
          },
          { poster: null, backdrop: "/hD8y787ciNWQ2bn396YrSsOIzdN.jpg" },
        ),
      ]),
    ),
  ),
  http.get(
    "https://api.themoviedb.org/3/trending/movie/:timeWindow",
    ({ params: { timeWindow } }) =>
      isTimeWindow(timeWindow)
        ? HttpResponse.json(page([trendingMovies[timeWindow]]))
        : undefined,
  ),
  http.get(
    "https://api.themoviedb.org/3/trending/tv/:timeWindow",
    ({ params: { timeWindow } }) =>
      isTimeWindow(timeWindow)
        ? HttpResponse.json(page([trendingShowsByTimeWindow[timeWindow]]))
        : undefined,
  ),
  // The trending shows' TVDB IDs, which make them requestable. Other shows aren't answered.
  http.get(
    "https://api.themoviedb.org/3/tv/:id/external_ids",
    ({ params: { id } }) => {
      const show = Object.values(trendingShows).find(
        ({ tmdbId }) => tmdbId.toString() === id,
      );

      return show
        ? HttpResponse.json({ id: show.tmdbId, tvdb_id: show.tvdbId })
        : undefined;
    },
  ),
] as const;
