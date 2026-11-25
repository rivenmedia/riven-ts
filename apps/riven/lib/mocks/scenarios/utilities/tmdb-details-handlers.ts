import { journeyFixtures } from "@repo/util-e2e";

import { HttpResponse, http } from "msw/http";

const { unrequestedMovie, unrequestedShow, season, episode } =
  journeyFixtures.mediaDetails;

const isMovie = (id: unknown) => id === unrequestedMovie.tmdbId.toString();
const isShow = (id: unknown) => id === unrequestedShow.tmdbId.toString();

// Images with a local copy at the size the details page requests, in the frontend's `mocks/remote-assets`
const posterPath = "/ulzhLuWrPK07P1YkdWQLZnQh1JL.jpg";
const backdropPath = "/qVGpxnjrGlHaSTCqTQI6viBDSfp.jpg";
const profilePath = "/oR7ZJsOHMNFzM1HeugV4a4qCMSF.jpg";

const emptyPage = {
  page: 1,
  results: [],
  total_pages: 1,
  total_results: 0,
};

const movieListItem = ({
  tmdbId,
  title,
}: {
  tmdbId: number;
  title: string;
}) => ({
  adult: false,
  backdrop_path: null,
  id: tmdbId,
  title,
  original_title: title,
  overview: `The overview of ${title}.`,
  poster_path: null,
  media_type: "movie",
  original_language: "en",
  genre_ids: [],
  popularity: 1,
  release_date: unrequestedMovie.releaseDate,
  softcore: false,
  video: false,
  vote_average: 7,
  vote_count: 100,
});

const movieCastMember = (
  { tmdbId, name, character }: (typeof unrequestedMovie.cast)[number],
  order: number,
) => ({
  adult: false,
  gender: 0,
  id: tmdbId,
  known_for_department: "Acting",
  name,
  original_name: name,
  popularity: 1,
  profile_path: profilePath,
  cast_id: tmdbId,
  character,
  credit_id: `credit-${tmdbId.toString()}`,
  order,
});

/**
 * TMDB's answers to the details pages of `journeyFixtures.mediaDetails`' movie and show,
 * and to the season and episode pages of the show.
 *
 * Requests for any other item aren't answered.
 */
export const tmdbDetailsHandlers = [
  http.get("https://api.themoviedb.org/3/movie/:id", ({ params: { id } }) =>
    isMovie(id)
      ? HttpResponse.json({
          id: unrequestedMovie.tmdbId,
          title: unrequestedMovie.title,
          original_language: "en",
          overview: unrequestedMovie.overview,
          release_date: unrequestedMovie.releaseDate,
          poster_path: posterPath,
          backdrop_path: backdropPath,
          genres: [
            { id: 27, name: "Horror" },
            { id: 53, name: "Thriller" },
          ],
          runtime: 135,
          status: "Released",
          imdb_id: "tt1396484",
          budget: 35_000_000,
          revenue: 700_000_000,
          production_companies: [],
          spoken_languages: [
            { english_name: "English", iso_639_1: "en", name: "English" },
          ],
        })
      : undefined,
  ),
  http.get(
    "https://api.themoviedb.org/3/movie/:id/videos",
    ({ params: { id } }) =>
      isMovie(id)
        ? HttpResponse.json({ id: unrequestedMovie.tmdbId, results: [] })
        : undefined,
  ),
  http.get(
    "https://api.themoviedb.org/3/movie/:id/credits",
    ({ params: { id } }) =>
      isMovie(id)
        ? HttpResponse.json({
            id: unrequestedMovie.tmdbId,
            cast: unrequestedMovie.cast.map(movieCastMember),
            crew: [],
          })
        : undefined,
  ),
  http.get(
    "https://api.themoviedb.org/3/movie/:id/recommendations",
    ({ params: { id } }) =>
      isMovie(id)
        ? HttpResponse.json({
            ...emptyPage,
            results: [movieListItem(unrequestedMovie.recommendation)],
            total_results: 1,
          })
        : undefined,
  ),
  http.get(
    "https://api.themoviedb.org/3/movie/:id/similar",
    ({ params: { id } }) =>
      isMovie(id)
        ? HttpResponse.json({
            ...emptyPage,
            results: [movieListItem(unrequestedMovie.similar)],
            total_results: 1,
          })
        : undefined,
  ),

  // The show's TMDB ID from its TVDB ID, and the episode's location from its TVDB ID
  http.get("https://api.themoviedb.org/3/find/:externalId", ({ params }) => {
    const { externalId } = params;

    if (externalId === unrequestedShow.tvdbId.toString()) {
      return HttpResponse.json({
        tv_results: [{ id: unrequestedShow.tmdbId }],
        tv_episode_results: [],
      });
    }

    if (externalId === episode.tvdbId.toString()) {
      return HttpResponse.json({
        tv_results: [],
        tv_episode_results: [
          {
            show_id: unrequestedShow.tmdbId,
            season_number: season.number,
            episode_number: episode.number,
          },
        ],
      });
    }

    return undefined;
  }),
  http.get("https://api.themoviedb.org/3/tv/:id", ({ params: { id } }) =>
    isShow(id)
      ? HttpResponse.json({
          id: unrequestedShow.tmdbId,
          name: unrequestedShow.title,
          overview: unrequestedShow.overview,
          original_language: "en",
          first_air_date: unrequestedShow.firstAirDate,
          poster_path: posterPath,
          backdrop_path: backdropPath,
          episode_run_time: [40],
          last_episode_to_air: null,
          genres: [{ id: 10_759, name: "Action & Adventure" }],
          homepage: "",
          status: "Ended",
          origin_country: ["US"],
          production_companies: [],
          spoken_languages: [
            { english_name: "English", iso_639_1: "en", name: "English" },
          ],
          external_ids: {
            imdb_id: "tt11126994",
            tvdb_id: unrequestedShow.tvdbId,
          },
        })
      : undefined,
  ),
  http.get("https://api.themoviedb.org/3/tv/:id/videos", ({ params: { id } }) =>
    isShow(id)
      ? HttpResponse.json({ id: unrequestedShow.tmdbId, results: [] })
      : undefined,
  ),
  http.get(
    "https://api.themoviedb.org/3/tv/:id/content_ratings",
    ({ params: { id } }) =>
      isShow(id)
        ? HttpResponse.json({
            results: [{ iso_3166_1: "US", rating: "TV-MA" }],
          })
        : undefined,
  ),
  http.get(
    "https://api.themoviedb.org/3/tv/:id/aggregate_credits",
    ({ params: { id } }) =>
      isShow(id)
        ? HttpResponse.json({
            id: unrequestedShow.tmdbId,
            cast: unrequestedShow.cast.map(
              ({ tmdbId, name, character }, order) => ({
                id: tmdbId,
                name,
                profile_path: profilePath,
                total_episode_count: 9,
                order,
                roles: [{ character, episode_count: 9 }],
              }),
            ),
          })
        : undefined,
  ),
  http.get(
    "https://api.themoviedb.org/3/tv/:id/recommendations",
    ({ params: { id } }) =>
      isShow(id) ? HttpResponse.json(emptyPage) : undefined,
  ),
  http.get(
    "https://api.themoviedb.org/3/tv/:id/similar",
    ({ params: { id } }) =>
      isShow(id) ? HttpResponse.json(emptyPage) : undefined,
  ),
  http.get(
    "https://api.themoviedb.org/3/tv/:id/season/:seasonNumber/episode/:episodeNumber/credits",
    ({ params: { id, seasonNumber, episodeNumber } }) =>
      isShow(id) &&
      seasonNumber === season.number.toString() &&
      episodeNumber === episode.number.toString()
        ? HttpResponse.json({
            id: episode.tvdbId,
            cast: episode.cast.map(({ tmdbId, name, character }, order) => ({
              id: tmdbId,
              name,
              profile_path: profilePath,
              character,
              order,
            })),
            guest_stars: [],
          })
        : undefined,
  ),
] as const;
