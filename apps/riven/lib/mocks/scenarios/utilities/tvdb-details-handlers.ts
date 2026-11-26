import { journeyFixtures } from "@repo/util-e2e";

import { HttpResponse, http } from "msw/http";

const { unrequestedShow, season, episode } = journeyFixtures.mediaDetails;

const isShow = (id: unknown) => id === unrequestedShow.tvdbId.toString();

// An image with a local copy in the frontend's `mocks/remote-assets`
const seasonPosterUrl =
  "https://artworks.thetvdb.com/banners/v4/season/830385/posters/6187fabf54442.jpg";

/**
 * TVDB's answers to the season and episode pages of `journeyFixtures.mediaDetails`' show,
 * whose seasons and episodes come from TVDB rather than TMDB.
 *
 * Requests for any other series aren't answered.
 */
export const tvdbDetailsHandlers = [
  http.get(
    "https://api4.thetvdb.com/v4/series/:id/extended",
    ({ params: { id } }) =>
      isShow(id)
        ? HttpResponse.json({
            status: "success",
            data: {
              id: unrequestedShow.tvdbId,
              name: unrequestedShow.title,
              seasons: [
                {
                  id: season.tvdbId,
                  number: season.number,
                  name: season.title,
                  image: seasonPosterUrl,
                  type: { id: 1, name: "Aired Order", type: "official" },
                },
              ],
            },
          })
        : undefined,
  ),
  http.get(
    "https://api4.thetvdb.com/v4/series/:id/episodes/official/:language",
    ({ params: { id } }) =>
      isShow(id)
        ? HttpResponse.json({
            status: "success",
            data: {
              episodes: [
                {
                  id: episode.tvdbId,
                  seriesId: unrequestedShow.tvdbId,
                  seasonNumber: season.number,
                  number: episode.number,
                  name: episode.title,
                  aired: episode.airDate,
                  runtime: 40,
                },
              ],
            },
            links: { next: null },
          })
        : undefined,
  ),
] as const;
