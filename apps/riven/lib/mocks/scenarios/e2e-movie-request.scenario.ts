// oxlint-disable sonarjs/no-clear-text-protocols -- `.invalid` hosts never resolve, and MSW answers these requests in-process
import { journeyFixtures } from "@repo/util-e2e";

import { HttpResponse, http } from "msw/http";
import path from "node:path";

import { gates } from "#mocks/utilities/gates.ts";

import { defineE2eScenario } from "./utilities/define-e2e-scenario.ts";

const { movieRequest } = journeyFixtures;

const stremThru = "http://stremthru.e2e.invalid";

// The torrent is named after its one file
const torrentName = path.parse(movieRequest.fileName).name;

const torrentFiles = [
  {
    name: movieRequest.fileName,
    path: `/${movieRequest.fileName}`,
    size: 4_294_967_296,
  },
];

// Once the store has downloaded the torrent, each file has a link to it, which Riven needs to keep the file
const downloadedTorrentFiles = torrentFiles.map((file) => ({
  ...file,
  link: `${stremThru}/e2e/files/${movieRequest.infohash}/${file.name}`,
}));

// Riven files movies under `movies` in the library, which the media servers find under their `/mount` default
const moviesLibraryPath = "/mount/movies";

const noContent = () => new HttpResponse(null, { status: 204 });

/**
 * A user requests a movie, which Riven indexes from TMDB (in the baseline), scrapes, downloads from StremThru and completes.
 *
 * Two answers wait for the test to release their gate, so it can see the movie in each state:
 * Torrentio's waits for `movieRequest.scrapeGateKey`, so the movie stays indexed but not scraped,
 * and StremThru's answer to adding the torrent waits for `movieRequest.downloadGateKey`, so it stays scraped but not downloaded.
 */
export const e2eMovieRequestScenario = defineE2eScenario({
  scenarioName: "e2e-movie-request",
  handlers: [
    // Scrape: Torrentio finds the torrent, and the other scrapers find nothing
    http.get("https://torrentio.strem.fun/*", async ({ request }) => {
      if (
        !new URL(request.url).pathname.endsWith(
          `/stream/movie/${movieRequest.imdbId}.json`,
        )
      ) {
        return undefined;
      }

      if (!(await gates.wait(movieRequest.scrapeGateKey))) {
        // The instance is being reset. Finding nothing ends the scrape without a retry.
        return HttpResponse.json({ streams: [] });
      }

      return HttpResponse.json({
        streams: [
          {
            title: `${torrentName}\n👤 120 💾 4 GB ⚙️ E2E`,
            infoHash: movieRequest.infohash,
          },
        ],
      });
    }),
    http.get(
      `http://comet.e2e.invalid/stream/movie/${movieRequest.imdbId}.json`,
      () => HttpResponse.json({ streams: [] }),
    ),
    http.get(`${stremThru}/v0/torznab/api`, ({ request }) => {
      const { searchParams } = new URL(request.url);

      return searchParams.get("t") === "movie" &&
        searchParams.get("imdbid") === movieRequest.imdbId
        ? HttpResponse.json({ channel: { items: [] } })
        : undefined;
    }),

    // Download: the torrent is cached on the store, which has downloaded it once it's added
    http.get(`${stremThru}/v0/store/torz/check`, ({ request }) => {
      const hashes =
        new URL(request.url).searchParams.get("hash")?.split(",") ?? [];

      return HttpResponse.json({
        data: {
          items: hashes.includes(movieRequest.infohash)
            ? [
                {
                  hash: movieRequest.infohash,
                  status: "cached",
                  files: torrentFiles,
                },
              ]
            : [],
        },
      });
    }),
    http.post(`${stremThru}/v0/store/torz`, async ({ request }) => {
      const { link } = (await request.json()) as { link?: string };

      if (link !== movieRequest.infohash) {
        return undefined;
      }

      if (!(await gates.wait(movieRequest.downloadGateKey))) {
        // The instance is being reset. Riven neither retries nor blacklists a 409, so the download ends without queueing more work.
        return HttpResponse.json(
          { error: { message: "The E2E instance was reset" } },
          { status: 409 },
        );
      }

      return HttpResponse.json({
        data: {
          id: `e2e-${movieRequest.infohash}`,
          status: "downloaded",
          files: downloadedTorrentFiles,
        },
      });
    }),

    // Once the movie downloads, the media servers refresh their libraries and a notification is sent
    http.post("http://jellyfin.e2e.invalid/Library/Media/Updated", noContent),
    http.get("http://plex.e2e.invalid/library/sections", () =>
      HttpResponse.json({
        MediaContainer: {
          Directory: [
            { key: "1", Location: [{ id: 1, path: moviesLibraryPath }] },
          ],
        },
      }),
    ),
    http.post(
      "http://plex.e2e.invalid/library/sections/:key/refresh",
      noContent,
    ),
    http.post("http://silo.e2e.invalid/api/v2/scan", () =>
      HttpResponse.json({
        status: "accepted",
        mode: "path",
        library_id: "e2e-movies",
      }),
    ),
    http.post("http://notifications.e2e.invalid/hook", noContent),
  ],
});
