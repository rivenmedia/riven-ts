import { HttpResponse, http } from "msw";
import { expect } from "vitest";

import { it } from "../../__tests__/tvdb.test-context.ts";
import { TvdbAPI } from "../tvdb.datasource.ts";

const SERIES_URL = "https://api4.thetvdb.com/v4/series/:id/translations/eng";

const authenticatedHandlers = (
  logins: unknown[],
  authorizations: (string | null)[],
) => [
  http.post("https://api4.thetvdb.com/v4/login", async ({ request }) => {
    logins.push(await request.json());

    return HttpResponse.json({
      status: "success",
      data: { token: `token-${logins.length.toString()}` },
    });
  }),
  http.get(SERIES_URL, ({ request, params }) => {
    authorizations.push(request.headers.get("authorization"));

    return HttpResponse.json({
      status: "success",
      data: { language: "eng", name: `Series ${String(params["id"])}` },
    });
  }),
];

it("logs in once and reuses the token for later requests", async ({
  server,
  dataSourceMap,
}) => {
  const logins: unknown[] = [];
  const authorizations: (string | null)[] = [];

  server.use(...authenticatedHandlers(logins, authorizations));

  const api = dataSourceMap.get(TvdbAPI);

  await Promise.all([
    api.getSeriesTranslations("1"),
    api.getSeriesTranslations("2"),
  ]);
  await api.getSeriesTranslations("3");

  expect(logins).toStrictEqual([
    { apikey: "6be85335-5c4f-4d8d-b945-d3ed0eb8cdce" },
  ]);
  expect(authorizations).toStrictEqual([
    "Bearer token-1",
    "Bearer token-1",
    "Bearer token-1",
  ]);
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
  server,
  dataSourceMap,
}) => {
  server.use(
    http.get(SERIES_URL, () => HttpResponse.json({ status: "success" })),
    ...authenticatedHandlers([], []),
  );

  await expect(
    dataSourceMap.get(TvdbAPI).getSeriesTranslations("81189"),
  ).rejects.toThrow(
    "Failed to retrieve series translations with id 81189: No data in response",
  );
});
