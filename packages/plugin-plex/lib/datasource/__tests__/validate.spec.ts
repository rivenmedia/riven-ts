import { HttpResponse, http } from "msw";
import { expect } from "vitest";

import { createUserPlexAccount } from "../../__generated__/mocks/createUserPlexAccount.ts";
import { it } from "../../__tests__/plex.test-context.ts";
import { PlexTvAPI } from "../plex-tv.datasource.ts";

it("returns false if the request fails", async ({ server, dataSourceMap }) => {
  server.use(
    http.get("https://plex.tv/api/v2/user", () => HttpResponse.error()),
  );

  const plexTvApi = dataSourceMap.get(PlexTvAPI);
  const isValid = await plexTvApi.validate();

  expect(isValid).toBe(false);
});

it("returns true if the request succeeds", async ({
  server,
  dataSourceMap,
}) => {
  server.use(
    http.get("https://plex.tv/api/v2/user", () =>
      HttpResponse.json(createUserPlexAccount({ uuid: "test-uuid" })),
    ),
  );

  const plexTvApi = dataSourceMap.get(PlexTvAPI);
  const isValid = await plexTvApi.validate();

  expect(isValid).toBe(true);
});

it("caches the user UUID after first call", async ({
  server,
  dataSourceMap,
}) => {
  let callCount = 0;

  server.use(
    http.get("https://plex.tv/api/v2/user", () => {
      callCount++;
      return HttpResponse.json(createUserPlexAccount({ uuid: "test-uuid" }));
    }),
  );

  const plexTvApi = dataSourceMap.get(PlexTvAPI);

  // Note: dataSourceMap is file-scoped, so the instance may already have
  // a cached UUID from the previous test. The key assertion is that
  // calling getUserUuid() twice does NOT make a second HTTP request.
  const initialCallCount = callCount;
  const uuid1 = await plexTvApi.getUserUuid();
  const uuid2 = await plexTvApi.getUserUuid();

  expect(uuid1).toBe(uuid2);
  expect(callCount).toBeLessThanOrEqual(initialCallCount + 1);
});
