import { plugin as cometPlugin } from "@repo/plugin-comet";
import { plugin as jellyfinPlugin } from "@repo/plugin-jellyfin";
import { plugin as notificationsPlugin } from "@repo/plugin-notifications";
import { plugin as plexPlugin } from "@repo/plugin-plex";
import { plugin as siloPlugin } from "@repo/plugin-silo";
import { plugin as stremThruPlugin } from "@repo/plugin-stremthru";
import { plugin as subdlPlugin } from "@repo/plugin-subdl";
import { plugin as tmdbPlugin } from "@repo/plugin-tmdb";
import { plugin as torrentioPlugin } from "@repo/plugin-torrentio";
import { createE2eEnvironment, journeyFixtures } from "@repo/util-e2e";
import { DataSourceMap } from "@repo/util-plugin-sdk";
import { ItemRequest, Movie } from "@repo/util-plugin-sdk/dto/entities";
import { PluginSettings } from "@repo/util-plugin-sdk/utilities/plugin-settings";

import { constantCase } from "es-toolkit";
import { randomUUID } from "node:crypto";
import path from "node:path";
import { expect, vi } from "vitest";

import { it as baseIt } from "#__tests__/test-context.ts";
import { gates } from "#mocks/utilities/gates.ts";
import { getLeafPaths } from "#settings/utilities/leaf-paths.ts";
import { resolveSettings } from "#settings/utilities/resolve-settings.ts";
import { logger } from "#utilities/logger/logger.ts";
import { redisCache } from "#utilities/redis-cache.ts";
import { settings } from "#utilities/settings.ts";
import { telemetry } from "#utilities/telemetry.ts";

import { e2eMovieRequestScenario } from "../e2e-movie-request.scenario.ts";

import type { RivenPlugin } from "@repo/util-plugin-sdk";

const { movieRequest } = journeyFixtures;

// Torrentio names the torrent after its one file
const torrentName = path.parse(movieRequest.fileName).name;

// The plugin settings every E2E Riven boots with
const e2eEnvironment = createE2eEnvironment({
  port: 9200,
  databaseUrl: "postgres://riven:riven@localhost:5432/riven_e2e_0",
  redisUrl: settings.redisUrl,
  vfsMountPath: "/var/lib/riven-e2e-0",
  apiKey: "e2e-api-key-0123456789abcdef0123456789",
  origin: "http://localhost:9000",
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
  // Builds a plugin's hook context as Riven's plugin registrar does, with the E2E environment's settings
  .extend("createHookContext", ({}, { onCleanup }) => {
    const dataSourceMaps: DataSourceMap[] = [];

    onCleanup(async () => {
      await Promise.all(
        dataSourceMaps.flatMap((dataSources) =>
          [...dataSources.values()].map(async (dataSource) =>
            dataSource.close(true),
          ),
        ),
      );
    });

    return (plugin: RivenPlugin) => {
      const prefix = constantCase(plugin.name.description ?? "");
      const environmentPrefix = `RIVEN_PLUGIN_SETTING__${prefix}__`;
      // Takes a copy, as the settings delete the environment variables they read
      const pluginSettings = new PluginSettings(
        { ...e2eEnvironment },
        [prefix],
        logger,
        false,
      );
      const { value } = resolveSettings({
        schema: plugin.settingsSchema,
        stored: {},
        env: Object.fromEntries(
          Object.entries(e2eEnvironment)
            .filter(([key]) => key.startsWith(environmentPrefix))
            .map(([key, setting]) => [
              key.slice(environmentPrefix.length),
              setting,
            ]),
        ),
      });

      pluginSettings.set(
        prefix,
        plugin.settingsSchema,
        value,
        getLeafPaths(plugin.settingsSchema).keys(),
      );

      const dataSources = new DataSourceMap();

      for (const DataSource of plugin.dataSources ?? []) {
        dataSources.set(
          DataSource,
          new DataSource({
            pluginSymbol: plugin.name,
            cache: redisCache,
            logger,
            connection: { url: settings.redisUrl },
            settings: value,
            telemetry,
            userAgent: "Riven/e2e",
          }),
        );
      }

      dataSourceMaps.push(dataSources);

      return { dataSources, settings: pluginSettings, logger };
    };
  })
  .extend("movie", () => {
    const movie = new Movie();

    movie.id = randomUUID();
    movie.title = movieRequest.title;
    movie.fullTitle = movieRequest.title;
    movie.tmdbId = movieRequest.tmdbId.toString();
    movie.imdbId = movieRequest.imdbId;

    return movie;
  })
  .extend("requestDownload", ({ createHookContext }) => {
    const hook = stremThruPlugin.hooks["riven.media-item.download.requested"];

    expect.assert(hook);

    const context = createHookContext(stremThruPlugin);

    return async () =>
      hook({
        ...context,
        event: { infoHash: movieRequest.infohash, provider: "torbox" },
      });
  });

it("indexes the movie from TMDB, released and with the IMDB ID the scrapers need", async ({
  createHookContext,
}) => {
  const hook = tmdbPlugin.hooks["riven.media-item.index.requested.movie"];
  const item = new ItemRequest();

  expect.assert(hook);

  item.id = randomUUID();
  item.type = "movie";
  item.tmdbId = movieRequest.tmdbId.toString();

  const result = await hook({
    ...createHookContext(tmdbPlugin),
    event: { item },
  });

  expect(result?.item).toMatchObject({
    title: movieRequest.title,
    imdbId: movieRequest.imdbId,
    releaseDate: expect.stringContaining(movieRequest.releaseDate),
    aliases: {},
  });
});

it.for([
  {
    plugin: torrentioPlugin,
    torrents: {
      [movieRequest.infohash]: torrentName,
    },
  },
  { plugin: cometPlugin, torrents: {} },
  { plugin: stremThruPlugin, torrents: {} },
])(
  "scrapes the movie with $plugin.name.description",
  async ({ plugin, torrents }, { createHookContext, movie }) => {
    const hook = plugin.hooks["riven.media-item.scrape.requested"];

    expect.assert(hook);

    gates.release(movieRequest.scrapeGateKey);

    await expect(
      hook({ ...createHookContext(plugin), event: { item: movie } }),
    ).resolves.toStrictEqual({ id: movie.id, results: torrents });
  },
);

it("ends the Torrentio scrape at once, finding nothing, when the gates are cleared", async ({
  createHookContext,
  movie,
}) => {
  const hook = torrentioPlugin.hooks["riven.media-item.scrape.requested"];

  expect.assert(hook);

  const wait = vi.spyOn(gates, "wait");
  const scrape = hook({
    ...createHookContext(torrentioPlugin),
    event: { item: movie },
  });

  await vi.waitFor(() => {
    expect(wait).toHaveBeenCalledWith(movieRequest.scrapeGateKey);
  });

  gates.clear();

  // Faster than the data source's 10 s retry backoff
  await expect(scrape).resolves.toStrictEqual({ id: movie.id, results: {} });
}, 5000);

it("finds the torrent's files in StremThru's cache", async ({
  createHookContext,
}) => {
  const hook =
    stremThruPlugin.hooks["riven.media-item.download.cache-check-requested"];

  expect.assert(hook);

  await expect(
    hook({
      ...createHookContext(stremThruPlugin),
      event: { infoHashes: [movieRequest.infohash], provider: "torbox" },
    }),
  ).resolves.toStrictEqual({
    [movieRequest.infohash]: [
      expect.objectContaining({ name: movieRequest.fileName }),
    ],
  });
});

it("downloads the torrent from StremThru once the gate is released", async ({
  requestDownload,
}) => {
  const wait = vi.spyOn(gates, "wait");
  const download = requestDownload();

  await vi.waitFor(() => {
    expect(wait).toHaveBeenCalledWith(movieRequest.downloadGateKey);
  });

  gates.release(movieRequest.downloadGateKey);

  await expect(download).resolves.toMatchObject({
    success: true,
    data: {
      files: [expect.objectContaining({ name: movieRequest.fileName })],
    },
  });
});

it("ends the StremThru download at once when the gates are cleared, as a status Riven neither retries nor blacklists", async ({
  requestDownload,
}) => {
  const wait = vi.spyOn(gates, "wait");
  const download = requestDownload();

  await vi.waitFor(() => {
    expect(wait).toHaveBeenCalledWith(movieRequest.downloadGateKey);
  });

  gates.clear();

  // Faster than the data source's 10 s retry backoff
  await expect(download).resolves.toStrictEqual({
    success: false,
    statusCode: 409,
  });
}, 5000);

it.for([jellyfinPlugin, plexPlugin, siloPlugin, notificationsPlugin])(
  "tells $name.description that the movie downloaded",
  async (plugin, { createHookContext, completedMovieContext }) => {
    const hook = plugin.hooks["riven.media-item.download.success"];

    expect.assert(hook);

    await expect(
      hook({
        ...createHookContext(plugin),
        event: {
          item: completedMovieContext.completedMovie,
          downloader: stremThruPlugin.name.description ?? "",
          provider: "torbox",
          durationMs: 1000,
        },
      }),
    ).resolves.toBeUndefined();
  },
);

it("finds no SubDL subtitles for the movie", async ({
  createHookContext,
  movie,
}) => {
  const hook = subdlPlugin.hooks["riven.media-item.subtitle.requested"];

  expect.assert(hook);

  await expect(
    hook({ ...createHookContext(subdlPlugin), event: { item: movie } }),
  ).resolves.toStrictEqual({ subtitles: [] });
});
