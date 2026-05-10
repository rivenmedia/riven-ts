import { Episode, Movie } from "@repo/util-plugin-sdk/dto/entities";

import { HttpResponse, http } from "msw";
import { expect, vi } from "vitest";

import { it } from "../../__tests__/subdl.test-context.ts";
import { SubdlAPI } from "../../datasource/subdl.datasource.ts";
import plugin from "../../index.ts";
import { SubdlSettings } from "../../subdl-settings.schema.ts";

const hook = plugin.hooks["riven.media-item.subtitle.requested"]!;

it("returns subtitles for a movie", async ({
  server,
  dataSourceMap,
  settings,
  logger,
}) => {
  const srtContent = "1\n00:00:01,000 --> 00:00:02,000\nHello\n";

  // Build a minimal stored ZIP with a .srt file
  const filenameBuf = Buffer.from("subtitle.srt", "utf8");
  const dataBuf = Buffer.from(srtContent, "utf8");
  const header = Buffer.alloc(30);

  header.writeUInt32LE(0x04034b50, 0);
  header.writeUInt16LE(20, 4);
  header.writeUInt16LE(0, 6);
  header.writeUInt16LE(0, 8);
  header.writeUInt32LE(dataBuf.length, 18);
  header.writeUInt32LE(dataBuf.length, 22);
  header.writeUInt16LE(filenameBuf.length, 26);
  header.writeUInt16LE(0, 28);

  const zipBuffer = Buffer.concat([header, filenameBuf, dataBuf]);

  server.use(
    http.get("https://api.subdl.com/api/v1/subtitles", () =>
      HttpResponse.json({
        status: true,
        subtitles: [
          {
            release_name: "Test.Movie.2024",
            name: "Test",
            lang: "English",
            url: "/subtitle/123.zip",
            season: null,
            episode: null,
          },
        ],
      }),
    ),
  );

  const originalFetch = globalThis.fetch;
  globalThis.fetch = vi
    .fn()
    .mockResolvedValue(new Response(zipBuffer, { status: 200 }));

  try {
    const item = Object.assign(Object.create(Movie.prototype), {
      id: "1",
      fullTitle: "Test Movie",
      tmdbId: "12345",
      imdbId: "tt1234567",
    });

    const result = await hook({
      dataSources: dataSourceMap,
      event: { item },
      settings,
      logger,
    } as any);

    expect(result.subtitles).toHaveLength(1);
    expect(result.subtitles[0]!.language).toBe("english");
    expect(result.subtitles[0]!.sourceProvider).toBe("subdl");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

it("returns empty subtitles for unsupported media type", async ({
  dataSourceMap,
  settings,
  logger,
}) => {
  // Not a Movie or Episode instance
  const item = { fullTitle: "Some Album" };

  const result = await hook({
    dataSources: dataSourceMap,
    event: { item },
    settings,
    logger,
  } as any);

  expect(result.subtitles).toHaveLength(0);
});

it("returns empty subtitles when no tmdbId or imdbId", async ({
  dataSourceMap,
  settings,
  logger,
}) => {
  const item = Object.assign(Object.create(Movie.prototype), {
    id: "1",
    fullTitle: "Unknown Movie",
    tmdbId: undefined,
    imdbId: undefined,
  });

  const result = await hook({
    dataSources: dataSourceMap,
    event: { item },
    settings,
    logger,
  } as any);

  expect(result.subtitles).toHaveLength(0);
});

it("returns empty subtitles when search finds nothing", async ({
  server,
  dataSourceMap,
  settings,
  logger,
}) => {
  server.use(
    http.get("https://api.subdl.com/api/v1/subtitles", () =>
      HttpResponse.json({
        status: true,
        subtitles: [],
      }),
    ),
  );

  const item = Object.assign(Object.create(Movie.prototype), {
    id: "1",
    fullTitle: "No Subs Movie",
    tmdbId: "99999",
    imdbId: null,
  });

  const result = await hook({
    dataSources: dataSourceMap,
    event: { item },
    settings,
    logger,
  } as any);

  expect(result.subtitles).toHaveLength(0);
});

it("handles download failure gracefully and continues", async ({
  server,
  dataSourceMap,
  settings,
  logger,
}) => {
  server.use(
    http.get("https://api.subdl.com/api/v1/subtitles", () =>
      HttpResponse.json({
        status: true,
        subtitles: [
          {
            release_name: "Test.Movie.2024",
            name: "Test",
            lang: "English",
            url: "/subtitle/fail.zip",
            season: null,
            episode: null,
          },
        ],
      }),
    ),
  );

  const originalFetch = globalThis.fetch;
  globalThis.fetch = vi
    .fn()
    .mockResolvedValue(
      new Response(null, { status: 500, statusText: "Server Error" }),
    );

  try {
    const item = Object.assign(Object.create(Movie.prototype), {
      id: "1",
      fullTitle: "Fail Movie",
      tmdbId: "11111",
      imdbId: null,
    });

    const result = await hook({
      dataSources: dataSourceMap,
      event: { item },
      settings,
      logger,
    } as any);

    expect(result.subtitles).toHaveLength(0);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

it("filters TV subtitles by season and episode", async ({
  server,
  dataSourceMap,
  settings,
  logger,
}) => {
  const srtContent = "1\n00:00:01,000 --> 00:00:02,000\nTV\n";
  const filenameBuf = Buffer.from("sub.srt", "utf8");
  const dataBuf = Buffer.from(srtContent, "utf8");
  const header = Buffer.alloc(30);

  header.writeUInt32LE(0x04034b50, 0);
  header.writeUInt16LE(20, 4);
  header.writeUInt16LE(0, 6);
  header.writeUInt16LE(0, 8);
  header.writeUInt32LE(dataBuf.length, 18);
  header.writeUInt32LE(dataBuf.length, 22);
  header.writeUInt16LE(filenameBuf.length, 26);
  header.writeUInt16LE(0, 28);
  const zipBuffer = Buffer.concat([header, filenameBuf, dataBuf]);

  server.use(
    http.get("https://api.subdl.com/api/v1/subtitles", () =>
      HttpResponse.json({
        status: true,
        subtitles: [
          {
            release_name: "Show.S01E01",
            name: "Match",
            lang: "English",
            url: "/subtitle/match.zip",
            season: 1,
            episode: 1,
          },
          {
            release_name: "Show.S01E02",
            name: "Wrong Episode",
            lang: "English",
            url: "/subtitle/wrong.zip",
            season: 1,
            episode: 2,
          },
        ],
      }),
    ),
  );

  const originalFetch = globalThis.fetch;
  globalThis.fetch = vi
    .fn()
    .mockResolvedValue(new Response(zipBuffer, { status: 200 }));

  try {
    const item = Object.assign(Object.create(Episode.prototype), {
      id: "1",
      fullTitle: "Show S01E01",
      imdbId: "tt9999999",
      number: 1,
      season: { loadProperty: vi.fn().mockResolvedValue(1) },
    });

    const result = await hook({
      dataSources: dataSourceMap,
      event: { item },
      settings,
      logger,
    } as any);

    expect(result.subtitles).toHaveLength(1);
    expect(result.subtitles[0]!.language).toBe("english");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

it("returns empty subtitles when downloadSubtitle returns undefined", async ({
  server,
  dataSourceMap,
  settings,
  logger,
}) => {
  server.use(
    http.get("https://api.subdl.com/api/v1/subtitles", () =>
      HttpResponse.json({
        status: true,
        subtitles: [
          {
            release_name: "Test.Movie.2024",
            name: "Test",
            lang: "English",
            url: "/subtitle/empty.zip",
            season: null,
            episode: null,
          },
        ],
      }),
    ),
  );

  const api = dataSourceMap.get(SubdlAPI);
  vi.spyOn(api, "downloadSubtitle").mockResolvedValue(undefined);

  const item = Object.assign(Object.create(Movie.prototype), {
    id: "1",
    fullTitle: "Empty Content Movie",
    tmdbId: "33333",
    imdbId: null,
  });

  const result = await hook({
    dataSources: dataSourceMap,
    event: { item },
    settings,
    logger,
  } as any);

  expect(result.subtitles).toHaveLength(0);
});
