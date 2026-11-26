import { HttpResponse, http } from "msw/http";
import { expect } from "vitest";

import { it } from "../../__tests__/silo.test-context.ts";
import { SiloAPI } from "../silo.datasource.ts";

it("requests a scan of the path within the Silo library path", async ({
  server,
  dataSourceMap,
}) => {
  const captured: { body?: unknown; authorization?: string | null } = {};

  server.use(
    http.post("**/api/v2/scan", async ({ request }) => {
      captured.body = await request.json();
      captured.authorization = request.headers.get("authorization");

      return HttpResponse.json(
        { status: "accepted", mode: "subtree", library_id: "1" },
        { status: 202 },
      );
    }),
  );

  const siloApi = dataSourceMap.get(SiloAPI);

  await siloApi.scanPath("movies/Oppenheimer (2023)");

  expect(captured.body).toStrictEqual({
    path: "/mount/movies/Oppenheimer (2023)",
  });
  expect(captured.authorization).toBe("Bearer sa_test-api-key");
});

it("throws a descriptive error if the path is rejected", async ({
  server,
  dataSourceMap,
}) => {
  server.use(
    http.post("**/api/v2/scan", () =>
      HttpResponse.json(
        {
          type: "https://siloserver.org/problems/malformed_request",
          status: 400,
        },
        { status: 400 },
      ),
    ),
  );

  const siloApi = dataSourceMap.get(SiloAPI);

  await expect(siloApi.scanPath("movies/Unknown")).rejects.toThrow(
    "Failed to scan /mount/movies/Unknown: the path is not inside a Silo library",
  );
});

it("throws a descriptive error if the API key is not an administrator's", async ({
  server,
  dataSourceMap,
}) => {
  server.use(
    http.post("**/api/v2/scan", () => HttpResponse.json({}, { status: 403 })),
  );

  const siloApi = dataSourceMap.get(SiloAPI);

  await expect(siloApi.scanPath("movies/Unknown")).rejects.toThrow(
    "the API key does not belong to an administrator",
  );
});

it("throws if the response body is not a scan acceptance", async ({
  server,
  dataSourceMap,
}) => {
  server.use(
    http.post("**/api/v2/scan", () =>
      HttpResponse.json({ status: "unexpected" }, { status: 202 }),
    ),
  );

  const siloApi = dataSourceMap.get(SiloAPI);

  await expect(siloApi.scanPath("movies/Unknown")).rejects.toThrow(
    "Failed to scan /mount/movies/Unknown",
  );
});

it("accepts a scan in a mode that Silo added later", async ({
  server,
  dataSourceMap,
}) => {
  server.use(
    http.post("**/api/v2/scan", () =>
      HttpResponse.json(
        { status: "accepted", mode: "collection", library_id: "1" },
        { status: 202 },
      ),
    ),
  );

  const siloApi = dataSourceMap.get(SiloAPI);

  await expect(
    siloApi.scanPath("movies/Oppenheimer (2023)"),
  ).resolves.toBeUndefined();
});

it.for([
  [401, "the API key is missing, invalid or expired"],
  [409, "the library is disabled, or the path's state conflicts with the scan"],
  [503, "the Silo scanner is not available"],
] as const)(
  "explains a %i response from Silo",
  async ([status, reason], { server, dataSourceMap }) => {
    server.use(
      http.post("**/api/v2/scan", () => HttpResponse.json({}, { status })),
    );

    await expect(
      dataSourceMap.get(SiloAPI).scanPath("movies/Unknown"),
    ).rejects.toThrow(`Failed to scan /mount/movies/Unknown: ${reason}`);
  },
);

it("falls back to the HTTP error message for statuses without a known reason", async ({
  server,
  dataSourceMap,
}) => {
  server.use(
    http.post("**/api/v2/scan", () => HttpResponse.json({}, { status: 418 })),
  );

  const failure = await dataSourceMap
    .get(SiloAPI)
    .scanPath("movies/Unknown")
    .catch((error: unknown) => error as Error);

  expect.assert(failure instanceof Error);

  expect(failure.name).toBe("SiloAPIError");
  expect(failure.message).toMatch(
    /^Failed to scan \/mount\/movies\/Unknown: .+/u,
  );
  expect(failure.message).not.toContain("the API key");
  expect(failure.cause).toBeInstanceOf(Error);
});

it("reports network failures and keeps the original error as the cause", async ({
  server,
  dataSourceMap,
}) => {
  server.use(http.post("**/api/v2/scan", () => HttpResponse.error()));

  const failure = await dataSourceMap
    .get(SiloAPI)
    .scanPath("movies/Unknown")
    .catch((error: unknown) => error as Error);

  expect.assert(failure instanceof Error);

  expect(failure.message).toMatch(
    /^Failed to scan \/mount\/movies\/Unknown: .+/u,
  );
  expect(failure.cause).toBeDefined();
});
