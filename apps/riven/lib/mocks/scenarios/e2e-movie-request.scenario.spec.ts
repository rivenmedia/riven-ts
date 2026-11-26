// oxlint-disable sonarjs/no-clear-text-protocols -- `.invalid` hosts never resolve, and MSW answers these requests in-process
import { plugin as torrentioPlugin } from "@repo/plugin-torrentio";
import { journeyFixtures } from "@repo/util-e2e";
import { parse, parseFilePath } from "@repo/util-rank-torrent-name";

import { DateTime } from "luxon";
import { randomUUID } from "node:crypto";
import { tmpdir } from "node:os";
import path from "node:path";
import { setTimeout } from "node:timers/promises";
import { expect, onTestFinished, vi } from "vitest";

import { it as baseIt } from "#__tests__/test-context.ts";
import { MatchedFile } from "#message-queue/flows/process-media-item/steps/download/steps/find-valid-torrent/find-valid-torrent.schema.ts";
import { mapItemsToFiles } from "#message-queue/sandboxed-jobs/jobs/map-items-to-files/utilities/map-items-to-files.ts";
import { gates } from "#mocks/utilities/gates.ts";
import {
  getRankingEngine,
  invalidateRankingEngine,
} from "#ranking/ranking-engine.ts";
import { syncRankingProfiles } from "#state-machines/bootstrap/actors/sync-ranking-profiles.actor.ts";

import { e2eMovieRequestScenario } from "./e2e-movie-request.scenario.ts";

import type { DebridFile } from "@repo/util-plugin-sdk/schemas/torrents/debrid-file";

const { movieRequest } = journeyFixtures;

const stremThruTorz = "http://stremthru.e2e.invalid/v0/store/torz";

// Plex refreshes the movie's directory in its library
const plexRefreshQuery = new URLSearchParams({
  path: path.join("/mount/movies", movieRequest.title),
});

const it = baseIt
  .extend("scenarioHandlers", { auto: true }, ({ server }, { onCleanup }) => {
    server.use(...(e2eMovieRequestScenario.handlers ?? []));

    // Releases any Torrentio or add-magnet request a test leaves held
    onCleanup(() => {
      gates.clear();
      gates.reopen();
    });
  })
  .extend(
    "addMagnet",
    () => async () =>
      fetch(stremThruTorz, {
        method: "POST",
        headers: { "x-stremthru-store-name": "torbox" },
        body: JSON.stringify({ link: movieRequest.infohash }),
      }),
  )
  .extend("requestTorrentioStreams", () => async () => {
    // The URL Riven's Torrentio plugin requests, with its default filter
    const { filter } = torrentioPlugin.settingsSchema.parse({});

    expect.assert(typeof filter === "string");

    return fetch(
      `https://torrentio.strem.fun/${filter}/stream/movie/${movieRequest.imdbId}.json`,
    );
  })
  .extend("torrentioStreams", async ({ requestTorrentioStreams }) => {
    gates.release(movieRequest.scrapeGateKey);

    const response = await requestTorrentioStreams();
    const { streams } = (await response.json()) as {
      streams: { infoHash: string; title: string }[];
    };

    return streams;
  })
  .extend("cachedFiles", async () => {
    const response = await fetch(
      `${stremThruTorz}/check?hash=${movieRequest.infohash},${"0".repeat(40)}`,
      { headers: { "x-stremthru-store-name": "torbox" } },
    );
    const { data } = (await response.json()) as {
      data: { items: { hash: string; status: string; files: DebridFile[] }[] };
    };

    return data.items;
  });

/** Settles with `held` if the promise is still pending after a short wait */
const held = Symbol("held");
const settledValue = async (promise: Promise<unknown>) =>
  Promise.race([promise, setTimeout(50, held)]);

it("has no environment data, so it can run in test mode", () => {
  expect(e2eMovieRequestScenario.environmentData).toBeUndefined();
});

it("answers the TMDB movie by its id", async () => {
  const details = await fetch(
    `https://api.themoviedb.org/3/movie/${movieRequest.tmdbId.toString()}`,
  );

  // Scrapers need the IMDB ID, and only a released movie is scraped
  await expect(details.json()).resolves.toMatchObject({
    id: movieRequest.tmdbId,
    title: movieRequest.title,
    imdb_id: movieRequest.imdbId,
    release_date: movieRequest.releaseDate,
  });

  const alternativeTitles = await fetch(
    `https://api.themoviedb.org/3/movie/${movieRequest.tmdbId.toString()}/alternative_titles`,
  );

  await expect(alternativeTitles.json()).resolves.toStrictEqual({
    id: movieRequest.tmdbId,
    titles: [],
  });
});

it.for(["videos", "credits", "recommendations", "similar"])(
  "answers TMDB's movie %s for the requested movie's details page",
  async (detailsPath) => {
    const response = await fetch(
      `https://api.themoviedb.org/3/movie/${movieRequest.tmdbId.toString()}/${detailsPath}`,
    );

    expect(response.ok).toBe(true);
  },
);

it("answers Torrentio with one torrent carrying the fixture infohash", ({
  torrentioStreams,
}) => {
  expect(torrentioStreams.map(({ infoHash }) => infoHash)).toStrictEqual([
    movieRequest.infohash,
  ]);
});

it("holds the Torrentio response until the gate is released", async ({
  requestTorrentioStreams,
}) => {
  const wait = vi.spyOn(gates, "wait");
  const response = requestTorrentioStreams();

  await vi.waitFor(() => {
    expect(wait).toHaveBeenCalledWith(movieRequest.scrapeGateKey);
  });
  await expect(settledValue(response)).resolves.toBe(held);

  gates.release(movieRequest.scrapeGateKey);

  const streams = await response;

  await expect(streams.json()).resolves.toMatchObject({
    streams: [expect.objectContaining({ infoHash: movieRequest.infohash })],
  });
});

it("answers the held Torrentio request with no streams once the gates are cleared, so the scrape ends without a retry", async ({
  requestTorrentioStreams,
}) => {
  const wait = vi.spyOn(gates, "wait");
  const response = requestTorrentioStreams();

  await vi.waitFor(() => {
    expect(wait).toHaveBeenCalledWith(movieRequest.scrapeGateKey);
  });

  gates.clear();

  const streams = await response;

  expect(streams.ok).toBe(true);
  await expect(streams.json()).resolves.toStrictEqual({ streams: [] });
});

it("names the torrent so that Riven's scrape parsing keeps it for the movie", ({
  torrentioStreams: [stream],
}) => {
  expect.assert(stream);

  // Torrentio puts the torrent's name on the stream title's first line
  const [torrentName = ""] = stream.title.split("\n");

  expect(parse(torrentName)).toMatchObject({
    title: movieRequest.title,
    year: DateTime.fromISO(movieRequest.releaseDate).year,
    seasons: [],
    episodes: [],
  });
});

it("names the torrent so that Riven's ranking, with the profiles it seeds, keeps it", async ({
  services: { rankingProfileService, settingsService },
  torrentioStreams: [stream],
}) => {
  expect.assert(stream);

  const [torrentName = ""] = stream.title.split("\n");

  invalidateRankingEngine();

  onTestFinished(() => {
    invalidateRankingEngine();
  });

  // Seeds the ranking profiles as a reset does, from a legacy ranking config that doesn't exist
  await syncRankingProfiles({
    rankingProfileService,
    settingsService,
    legacyConfigPath: path.join(tmpdir(), randomUUID(), "ranking.json"),
  });

  const rankingEngine = await getRankingEngine({
    rankingProfileService,
    settingsService,
    environment: {},
  });
  const ranked = rankingEngine.rankTorrent(
    torrentName,
    stream.infoHash,
    movieRequest.title,
    {},
  );

  expect(rankingEngine.sortTorrents([ranked])).toStrictEqual([ranked]);
});

it.for([
  {
    name: "Comet",
    url: `http://comet.e2e.invalid/stream/movie/${movieRequest.imdbId}.json`,
    noTorrents: { streams: [] },
  },
  {
    name: "StremThru's Torznab",
    url: `http://stremthru.e2e.invalid/v0/torznab/api?o=json&imdbid=${movieRequest.imdbId}&t=movie&cat=2000`,
    noTorrents: { channel: { items: [] } },
  },
])("finds no torrents on $name", async ({ url, noTorrents }) => {
  const response = await fetch(url);

  await expect(response.json()).resolves.toStrictEqual(noTorrents);
});

it("answers the StremThru cache check with the torrent's files", ({
  cachedFiles,
}) => {
  expect(cachedFiles).toStrictEqual([
    {
      hash: movieRequest.infohash,
      status: "cached",
      files: [expect.objectContaining({ name: movieRequest.fileName })],
    },
  ]);
});

it("caches a file that Riven maps and validates as the movie", ({
  cachedFiles: [cached],
}) => {
  expect.assert(cached);

  const { movies, episodes } = mapItemsToFiles(cached.files);

  expect(Object.values(movies)).toStrictEqual(cached.files);
  expect(episodes).toStrictEqual({});

  for (const file of cached.files) {
    expect(parseFilePath(file.path).type).toBe("movie");
  }
});

it("holds the StremThru add-magnet response until the gate is released", async ({
  addMagnet,
}) => {
  const wait = vi.spyOn(gates, "wait");
  const response = addMagnet();

  await vi.waitFor(() => {
    expect(wait).toHaveBeenCalledWith(movieRequest.downloadGateKey);
  });
  await expect(settledValue(response)).resolves.toBe(held);

  gates.release(movieRequest.downloadGateKey);

  const added = await response;

  // Riven only keeps a torrent its store has finished downloading
  await expect(added.json()).resolves.toMatchObject({
    data: {
      status: "downloaded",
      files: [expect.objectContaining({ name: movieRequest.fileName })],
    },
  });
});

it("downloads files with the link Riven needs to keep them", async ({
  addMagnet,
}) => {
  gates.release(movieRequest.downloadGateKey);

  const response = await addMagnet();
  const { data } = (await response.json()) as { data: { files: DebridFile[] } };

  // A downloaded file isn't from the cache check, so Riven only keeps it with its download link
  expect(
    data.files.map(
      (file) =>
        MatchedFile.safeParse({
          ...file,
          matchedMediaItemId: randomUUID(),
          isCachedFile: false,
        }).success,
    ),
  ).toStrictEqual([true]);
});

it("fails the held add-magnet request once the gates are cleared, without a status Riven retries or blacklists", async ({
  addMagnet,
}) => {
  const wait = vi.spyOn(gates, "wait");
  const response = addMagnet();

  await vi.waitFor(() => {
    expect(wait).toHaveBeenCalledWith(movieRequest.downloadGateKey);
  });

  gates.clear();

  await expect(response).resolves.toHaveProperty("status", 409);
});

it("lists a Plex section that holds Riven's movies", async () => {
  const response = await fetch("http://plex.e2e.invalid/library/sections");

  await expect(response.json()).resolves.toMatchObject({
    MediaContainer: {
      Directory: [{ key: "1", Location: [{ path: "/mount/movies" }] }],
    },
  });
});

it.for([
  {
    name: "Jellyfin's library update",
    url: "http://jellyfin.e2e.invalid/Library/Media/Updated",
  },
  {
    name: "Plex's section refresh",
    url: `http://plex.e2e.invalid/library/sections/1/refresh?${plexRefreshQuery.toString()}`,
  },
  { name: "Silo's scan", url: "http://silo.e2e.invalid/api/v2/scan" },
  {
    name: "the JSON webhook notification",
    url: "http://notifications.e2e.invalid/hook",
  },
])("answers $name once the movie downloads", async ({ url }) => {
  const response = await fetch(url, { method: "POST", body: "{}" });

  expect(response.ok).toBe(true);
});

it("finds no SubDL subtitles for the movie", async () => {
  const response = await fetch(
    `https://api.subdl.com/api/v1/subtitles?type=movie&subs_per_page=30&tmdb_id=${movieRequest.tmdbId.toString()}&api_key=e2e-subdl-key`,
  );

  await expect(response.json()).resolves.toMatchObject({
    status: true,
    subtitles: [],
  });
});
