import { Movie, Show } from "@repo/util-plugin-sdk/dto/entities";

import { HttpResponse, http } from "msw/http";
import { createHash } from "node:crypto";
import { expect } from "vitest";

import { createZip } from "./helpers/create-zip.ts";
import { it } from "./subdl.test-context.ts";

import type { SubtitleSearchResponse } from "../schemas/subtitle-search.response.schema.ts";
import type { MediaItem } from "@repo/util-plugin-sdk/dto/entities";

const SEARCH_URL = "https://api.subdl.com/api/v1/subtitles";
const ENGLISH = "1\n00:00:01,000 --> 00:00:02,000\nHello\n";
const SPANISH = "1\n00:00:01,000 --> 00:00:02,000\nHola, señor\n";

const createMovie = () => {
  const movie = new Movie();

  movie.fullTitle = "The Matrix (1999)";
  movie.tmdbId = "603";
  movie.imdbId = "tt0133093";

  return movie;
};

const subtitle = (lang: string, url: string) => ({
  release_name: "The.Matrix.1999.1080p",
  name: "The Matrix",
  lang,
  url,
});

const md5 = (content: string) =>
  // oxlint-disable-next-line sonarjs/hashing -- matches the checksum the plugin reports
  createHash("md5").update(content).digest("hex");

it("downloads the first subtitle of each language", async ({
  server,
  plugin,
  settings,
  logger,
  dataSourceMap,
}) => {
  const subtitleRequestedHook =
    plugin.hooks["riven.media-item.subtitle.requested"];

  expect.assert(subtitleRequestedHook);

  const downloadedPaths: string[] = [];

  server.use(
    http.get(SEARCH_URL, () =>
      HttpResponse.json<SubtitleSearchResponse>({
        status: true,
        subtitles: [
          subtitle("English", "/subtitle/en-1.zip"),
          subtitle("Spanish", "/subtitle/es-1.zip"),
          subtitle("English", "/subtitle/en-2.zip"),
        ],
      }),
    ),
    http.get(
      "https://dl.subdl.com/subtitle/:file",
      async ({ params, request }) => {
        downloadedPaths.push(new URL(request.url).pathname);

        const content = String(params["file"]).startsWith("en")
          ? ENGLISH
          : SPANISH;

        return new HttpResponse(
          await createZip([
            { filename: "movie.srt", content, compressionMethod: 8 },
          ]),
        );
      },
    ),
  );

  const response = await subtitleRequestedHook({
    dataSources: dataSourceMap,
    event: { item: createMovie() },
    logger,
    settings,
  });

  expect(downloadedPaths).toStrictEqual([
    "/subtitle/en-1.zip",
    "/subtitle/es-1.zip",
  ]);
  expect(response).toStrictEqual({
    subtitles: [
      {
        language: "english",
        content: ENGLISH,
        fileSize: Buffer.byteLength(ENGLISH, "utf8"),
        fileHash: md5(ENGLISH),
        sourceProvider: "subdl",
        sourceId: "/subtitle/en-1.zip",
      },
      {
        language: "spanish",
        content: SPANISH,
        fileSize: Buffer.byteLength(SPANISH, "utf8"),
        fileHash: md5(SPANISH),
        sourceProvider: "subdl",
        sourceId: "/subtitle/es-1.zip",
      },
    ],
  });
});

it("skips languages whose subtitle cannot be downloaded or extracted", async ({
  server,
  plugin,
  settings,
  logger,
  dataSourceMap,
}) => {
  const subtitleRequestedHook =
    plugin.hooks["riven.media-item.subtitle.requested"];

  expect.assert(subtitleRequestedHook);

  server.use(
    http.get(SEARCH_URL, () =>
      HttpResponse.json<SubtitleSearchResponse>({
        status: true,
        subtitles: [
          subtitle("English", "https://cdn.example.com/missing.zip"),
          subtitle("French", "https://cdn.example.com/no-srt.zip"),
          subtitle("Spanish", "https://cdn.example.com/es.zip"),
        ],
      }),
    ),
    http.get("https://cdn.example.com/missing.zip", () =>
      HttpResponse.text("Not Found", { status: 404 }),
    ),
    http.get(
      "https://cdn.example.com/no-srt.zip",
      async () =>
        new HttpResponse(
          await createZip([{ filename: "readme.txt", content: "Hello" }]),
        ),
    ),
    http.get(
      "https://cdn.example.com/es.zip",
      async () =>
        new HttpResponse(
          await createZip([{ filename: "movie.srt", content: SPANISH }]),
        ),
    ),
  );

  const response = await subtitleRequestedHook({
    dataSources: dataSourceMap,
    event: { item: createMovie() },
    logger,
    settings,
  });

  expect(response).toStrictEqual({
    subtitles: [
      expect.objectContaining({
        language: "spanish",
        content: SPANISH,
        sourceId: "https://cdn.example.com/es.zip",
      }),
    ],
  });
});

it.for([
  {
    scenario: "the item type is not supported",
    createItem: (): MediaItem => {
      const show = new Show();

      show.imdbId = "tt0944947";

      return show;
    },
  },
  {
    scenario: "the item has no TMDB or IMDB ID",
    createItem: (): MediaItem => {
      const movie = new Movie();

      movie.imdbId = null;

      return movie;
    },
  },
])(
  "returns no subtitles without searching when $scenario",
  async (
    { createItem },
    { server, plugin, settings, logger, dataSourceMap },
  ) => {
    const subtitleRequestedHook =
      plugin.hooks["riven.media-item.subtitle.requested"];

    expect.assert(subtitleRequestedHook);

    let searchCount = 0;

    server.use(
      http.get(SEARCH_URL, () => {
        searchCount += 1;

        return HttpResponse.json(null, { status: 500 });
      }),
    );

    await expect(
      subtitleRequestedHook({
        dataSources: dataSourceMap,
        event: { item: createItem() },
        logger,
        settings,
      }),
    ).resolves.toStrictEqual({ subtitles: [] });
    expect(searchCount).toBe(0);
  },
);

it("returns no subtitles when none are found", async ({
  server,
  plugin,
  settings,
  logger,
  dataSourceMap,
}) => {
  const subtitleRequestedHook =
    plugin.hooks["riven.media-item.subtitle.requested"];

  expect.assert(subtitleRequestedHook);

  server.use(
    http.get(SEARCH_URL, () =>
      HttpResponse.json<SubtitleSearchResponse>({
        status: true,
        subtitles: [],
      }),
    ),
  );

  await expect(
    subtitleRequestedHook({
      dataSources: dataSourceMap,
      event: { item: createMovie() },
      logger,
      settings,
    }),
  ).resolves.toStrictEqual({ subtitles: [] });
});
