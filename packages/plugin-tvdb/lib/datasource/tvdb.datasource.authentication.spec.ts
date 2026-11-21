import { HttpResponse, http } from "msw/http";
import { expect } from "vitest";

import { it as baseIt } from "../__tests__/tvdb.test-context.ts";
import { TvdbAPI } from "./tvdb.datasource.ts";

const SERIES_URL = "https://api4.thetvdb.com/v4/series/:id/translations/eng";

const API_KEY = "6be85335-5c4f-4d8d-b945-d3ed0eb8cdce";

const it = baseIt
  /**
   * Issues a new token for each login, and only answers series requests that
   * use the first one.
   */
  .extend("authenticatedHandlers", () => (logins: { count: number }) => [
    http.post("https://api4.thetvdb.com/v4/login", async ({ request }) => {
      const body = (await request.json()) as { apikey?: unknown } | null;

      if (body?.apikey !== API_KEY) {
        return HttpResponse.json(null, { status: 401 });
      }

      logins.count += 1;

      return HttpResponse.json({
        status: "success",
        data: { token: `token-${logins.count.toString()}` },
      });
    }),
    http.get(SERIES_URL, ({ request, params }) => {
      if (request.headers.get("authorization") !== "Bearer token-1") {
        return HttpResponse.json(null, { status: 401 });
      }

      return HttpResponse.json({
        status: "success",
        data: { language: "eng", name: `Series ${String(params["id"])}` },
      });
    }),
  ]);

it("logs in once and reuses the token for later requests", async ({
  authenticatedHandlers,
  server,
  dataSourceMap,
}) => {
  const logins = { count: 0 };

  server.use(...authenticatedHandlers(logins));

  const api = dataSourceMap.get(TvdbAPI);

  const translations = [
    ...(await Promise.all([
      api.getSeriesTranslations("1"),
      api.getSeriesTranslations("2"),
    ])),
    await api.getSeriesTranslations("3"),
  ];

  expect(translations.map((translation) => translation.name)).toStrictEqual([
    "Series 1",
    "Series 2",
    "Series 3",
  ]);
  expect(logins.count).toBe(1);
});

it("rejects requests when the login response has no token", async ({
  server,
  dataSourceMap,
}) => {
  server.use(
    http.post("https://api4.thetvdb.com/v4/login", () =>
      HttpResponse.json({ status: "success", data: {} }),
    ),
  );

  await expect(
    dataSourceMap.get(TvdbAPI).getSeriesTranslations("1"),
  ).rejects.toThrow("Failed to retrieve TVDB API token: No token in response");
});

it("rejects a series translation response without data", async ({
  authenticatedHandlers,
  server,
  dataSourceMap,
}) => {
  server.use(
    http.get(SERIES_URL, () => HttpResponse.json({ status: "success" })),
    ...authenticatedHandlers({ count: 0 }),
  );

  await expect(
    dataSourceMap.get(TvdbAPI).getSeriesTranslations("81189"),
  ).rejects.toThrow(
    "Failed to retrieve series translations with id 81189: No data in response",
  );
});
