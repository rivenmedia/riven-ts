import { HttpResponse, http } from "msw";
import { describe, expect } from "vitest";

import { it } from "../../__tests__/tvdb.test-context.ts";
import { TvMazeAPI } from "../tvmaze.datasource.ts";

describe("TvMazeAPI", () => {
  it("getShowTimezone returns timezone when network exists", async ({
    server,
    dataSourceMap,
  }) => {
    server.use(
      http.get("https://api.tvmaze.com/lookup/shows", () =>
        HttpResponse.json({
          network: {
            country: {
              timezone: "America/New_York",
            },
          },
        }),
      ),
    );

    const api = dataSourceMap.get(TvMazeAPI);
    const tz = await api.getShowTimezone("12345");

    expect(tz).toBe("America/New_York");
  });

  it("getShowTimezone returns undefined when response is null", async ({
    server,
    dataSourceMap,
  }) => {
    server.use(
      http.get("https://api.tvmaze.com/lookup/shows", () =>
        HttpResponse.json(null),
      ),
    );

    const api = dataSourceMap.get(TvMazeAPI);
    const tz = await api.getShowTimezone("12345");

    expect(tz).toBeUndefined();
  });

  it("getShowTimezone returns undefined on error", async ({
    server,
    dataSourceMap,
  }) => {
    server.use(
      http.get("https://api.tvmaze.com/lookup/shows", () =>
        HttpResponse.error(),
      ),
    );

    const api = dataSourceMap.get(TvMazeAPI);
    const tz = await api.getShowTimezone("12345");

    expect(tz).toBeUndefined();
  });

  it("getShowTimezone returns undefined when network is null", async ({
    server,
    dataSourceMap,
  }) => {
    server.use(
      http.get("https://api.tvmaze.com/lookup/shows", () =>
        HttpResponse.json({
          network: null,
        }),
      ),
    );

    const api = dataSourceMap.get(TvMazeAPI);
    const tz = await api.getShowTimezone("12345");

    expect(tz).toBeUndefined();
  });
});
