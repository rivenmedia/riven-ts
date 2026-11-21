import { HttpResponse, http } from "msw";
import { expect, vi } from "vitest";

import { it } from "../../__tests__/tvdb.test-context.ts";
import { TvMazeAPI } from "../tvmaze.datasource.ts";

const LOOKUP_URL = "https://api.tvmaze.com/lookup/shows";

it("returns the timezone of the show's network", async ({
  dataSourceMap,
  server,
}) => {
  const tvdbIds: (string | null)[] = [];

  server.use(
    http.get(LOOKUP_URL, ({ request }) => {
      tvdbIds.push(new URL(request.url).searchParams.get("thetvdb"));

      return HttpResponse.json({
        id: 169,
        network: {
          id: 20,
          name: "AMC",
          country: {
            name: "United States",
            code: "US",
            timezone: "America/New_York",
          },
        },
      });
    }),
  );

  await expect(
    dataSourceMap.get(TvMazeAPI).getShowTimezone("81189"),
  ).resolves.toBe("America/New_York");

  expect(tvdbIds).toStrictEqual(["81189"]);
});

it("returns no timezone for a show without a network", async ({
  dataSourceMap,
  server,
}) => {
  server.use(
    http.get(LOOKUP_URL, () => HttpResponse.json({ id: 1, network: null })),
  );

  await expect(
    dataSourceMap.get(TvMazeAPI).getShowTimezone("81189"),
  ).resolves.toBeUndefined();
});

it("returns no timezone when TVMaze does not know the show", async ({
  dataSourceMap,
  server,
}) => {
  server.use(http.get(LOOKUP_URL, () => HttpResponse.json(null)));

  await expect(
    dataSourceMap.get(TvMazeAPI).getShowTimezone("81189"),
  ).resolves.toBeUndefined();
});

it("logs and returns no timezone when the lookup returns an unknown timezone", async ({
  dataSourceMap,
  server,
}) => {
  const api = dataSourceMap.get(TvMazeAPI);
  const warn = vi.spyOn(api.logger, "warn");

  server.use(
    http.get(LOOKUP_URL, () =>
      HttpResponse.json({
        network: { country: { timezone: "Not/A_Timezone" } },
      }),
    ),
  );

  await expect(api.getShowTimezone("81189")).resolves.toBeUndefined();

  expect(warn).toHaveBeenCalledWith(
    "Failed to retrieve show timezone from TVMaze for TVDB ID 81189",
    expect.objectContaining({ err: expect.any(Error) }),
  );
});

it("logs and returns no timezone when TVMaze cannot find the show", async ({
  dataSourceMap,
  server,
}) => {
  const api = dataSourceMap.get(TvMazeAPI);
  const warn = vi.spyOn(api.logger, "warn");

  server.use(
    http.get(LOOKUP_URL, () => HttpResponse.json(null, { status: 404 })),
  );

  await expect(api.getShowTimezone("81189")).resolves.toBeUndefined();

  expect(warn).toHaveBeenCalledOnce();
});
