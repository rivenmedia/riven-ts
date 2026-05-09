import { HttpResponse, http } from "msw";
import { expect } from "vitest";

import { it } from "../../__tests__/subdl.test-context.ts";
import { SubdlAPI } from "../subdl.datasource.ts";

it("returns false if the request fails", async ({ server, dataSourceMap }) => {
  server.use(
    http.get("https://api.subdl.com/api/v1/subtitles", () =>
      HttpResponse.json({ status: false }, { status: 401 }),
    ),
  );

  const api = dataSourceMap.get(SubdlAPI);

  expect(await api.validate()).toBe(false);
});

it("returns true if the request succeeds", async ({
  server,
  dataSourceMap,
}) => {
  server.use(
    http.get("https://api.subdl.com/api/v1/subtitles", () =>
      HttpResponse.json({
        status: true,
        results: [
          {
            sd_id: 123456,
            name: "Inception",
          },
        ],
        subtitles: [
          {
            release_name: "Inception.2010.1080p",
            name: "Inception.2010.1080p.srt",
            lang: "en",
            author: "testuser",
            url: "/subtitle/123.zip",
            subtitlePage: "/subtitle/123",
          },
        ],
      }),
    ),
  );

  const api = dataSourceMap.get(SubdlAPI);

  expect(await api.validate()).toBe(true);
});

it("returns subtitles for a movie search", async ({
  server,
  dataSourceMap,
}) => {
  server.use(
    http.get("https://api.subdl.com/api/v1/subtitles", ({ request }) => {
      const url = new URL(request.url);

      if (url.searchParams.get("tmdb_id") !== "27205") {
        return HttpResponse.json(
          { status: false, error: "Invalid tmdbId" },
          { status: 200 },
        );
      }

      if (url.searchParams.get("type") !== "movie") {
        return HttpResponse.json(
          { status: false, error: "Invalid type" },
          { status: 200 },
        );
      }

      if (
        url.searchParams.get("languages")?.split(",").sort().join(",") !==
        "de,en"
      ) {
        return HttpResponse.json(
          { status: false, error: "Invalid languages" },
          { status: 200 },
        );
      }

      return HttpResponse.json({
        status: true,
        results: [{ sd_id: 1, name: "Inception" }],
        subtitles: [
          {
            release_name: "Inception.2010.1080p",
            name: "Inception.2010.1080p.srt",
            lang: "en",
            author: "testuser",
            url: "/subtitle/123.zip",
          },
          {
            release_name: "Inception.2010.1080p.de",
            name: "Inception.2010.1080p.de.srt",
            lang: "de",
            author: "testuser",
            url: "/subtitle/124.zip",
          },
        ],
      });
    }),
  );

  const api = dataSourceMap.get(SubdlAPI);

  const results = await api.searchSubtitles({
    tmdbId: "27205",
    type: "movie",
    languages: ["en", "de"],
  });

  expect(results).toHaveLength(2);
  expect(results[0]?.lang).toBe("en");
  expect(results[1]?.lang).toBe("de");
});

it("returns empty array when API returns no subtitles", async ({
  server,
  dataSourceMap,
}) => {
  server.use(
    http.get("https://api.subdl.com/api/v1/subtitles", () =>
      HttpResponse.json({
        status: true,
        results: [],
        subtitles: [],
      }),
    ),
  );

  const api = dataSourceMap.get(SubdlAPI);

  const results = await api.searchSubtitles({
    tmdbId: "999999",
    type: "movie",
  });

  expect(results).toHaveLength(0);
});
