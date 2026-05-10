import { HttpResponse, http } from "msw";
import { expect, vi } from "vitest";

import { it } from "../../__tests__/subdl.test-context.ts";
import { SubdlAPI } from "../subdl.datasource.ts";

it("searchSubtitles returns parsed subtitles", async ({
  server,
  dataSourceMap,
}) => {
  server.use(
    http.get("https://api.subdl.com/api/v1/subtitles", () =>
      HttpResponse.json({
        status: true,
        results: [{ sd_id: 1, name: "Test Movie" }],
        subtitles: [
          {
            release_name: "Test.Movie.2024",
            name: "Test Subtitle",
            lang: "English",
            url: "/subtitle/123.zip",
            season: null,
            episode: null,
          },
          {
            release_name: "Test.Movie.2024.Alt",
            name: "Alt Subtitle",
            lang: "Spanish",
            url: "/subtitle/456.zip",
            season: null,
            episode: null,
          },
        ],
      }),
    ),
  );

  const api = dataSourceMap.get(SubdlAPI);

  const results = await api.searchSubtitles({
    tmdbId: "12345",
    type: "movie",
    languages: ["en", "es"],
  });

  expect(results).toHaveLength(2);
  expect(results[0]!.lang).toBe("English");
  expect(results[1]!.lang).toBe("Spanish");
});

it("searchSubtitles uses imdbId when tmdbId is not provided", async ({
  server,
  dataSourceMap,
}) => {
  server.use(
    http.get("https://api.subdl.com/api/v1/subtitles", ({ request }) => {
      const url = new URL(request.url);

      expect(url.searchParams.get("imdb_id")).toBe("tt1234567");
      expect(url.searchParams.has("tmdb_id")).toBe(false);

      return HttpResponse.json({
        status: true,
        subtitles: [],
      });
    }),
  );

  const api = dataSourceMap.get(SubdlAPI);

  await api.searchSubtitles({
    imdbId: "tt1234567",
    type: "movie",
  });
});

it("searchSubtitles throws on invalid response format", async ({
  server,
  dataSourceMap,
}) => {
  server.use(
    http.get("https://api.subdl.com/api/v1/subtitles", () =>
      HttpResponse.json({ unexpected: "data" }),
    ),
  );

  const api = dataSourceMap.get(SubdlAPI);

  await expect(
    api.searchSubtitles({ tmdbId: "1", type: "movie" }),
  ).rejects.toThrow("Invalid response format from SubDL");
});

it("searchSubtitles throws on API error status", async ({
  server,
  dataSourceMap,
}) => {
  server.use(
    http.get("https://api.subdl.com/api/v1/subtitles", () =>
      HttpResponse.json({ status: false, error: "Rate limited" }),
    ),
  );

  const api = dataSourceMap.get(SubdlAPI);

  await expect(
    api.searchSubtitles({ tmdbId: "1", type: "movie" }),
  ).rejects.toThrow("Subtitle search failed: Rate limited");
});

it("downloadSubtitle fetches and extracts .srt from zip", async ({
  dataSourceMap,
}) => {
  const srtContent = "1\n00:00:01,000 --> 00:00:02,000\nHello\n";

  // Build a minimal stored ZIP with a .srt file
  const filenameBuf = Buffer.from("subtitle.srt", "utf8");
  const dataBuf = Buffer.from(srtContent, "utf8");
  const header = Buffer.alloc(30);

  header.writeUInt32LE(0x04034b50, 0);
  header.writeUInt16LE(20, 4);
  header.writeUInt16LE(0, 6);
  header.writeUInt16LE(0, 8); // stored
  header.writeUInt32LE(dataBuf.length, 18);
  header.writeUInt32LE(dataBuf.length, 22);
  header.writeUInt16LE(filenameBuf.length, 26);
  header.writeUInt16LE(0, 28);

  const zipBuffer = Buffer.concat([header, filenameBuf, dataBuf]);

  // Mock global fetch for the download
  const originalFetch = globalThis.fetch;
  globalThis.fetch = vi
    .fn()
    .mockResolvedValue(new Response(zipBuffer, { status: 200 }));

  try {
    const api = dataSourceMap.get(SubdlAPI);
    const result = await api.downloadSubtitle("/subtitle/123.zip");

    expect(result).toBe(srtContent);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

it("downloadSubtitle throws on HTTP error", async ({ dataSourceMap }) => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = vi
    .fn()
    .mockResolvedValue(
      new Response(null, { status: 404, statusText: "Not Found" }),
    );

  try {
    const api = dataSourceMap.get(SubdlAPI);

    await expect(api.downloadSubtitle("/subtitle/404.zip")).rejects.toThrow(
      /Failed to download subtitle/,
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});
