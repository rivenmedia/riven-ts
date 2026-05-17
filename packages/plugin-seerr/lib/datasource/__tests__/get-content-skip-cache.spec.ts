import { HttpResponse, http } from "msw";
import { expect } from "vitest";

import { it } from "../../__tests__/seerr.test-context.ts";
import { SeerrAPI } from "../seerr.datasource.ts";

// Regression test for the BullMQ dedup bypass:
// `getContent` calls hit `GET /request` with `skipCache: true` because the
// caller (the periodic content-services scheduler) wants fresh data on every
// tick. The HTTP-layer cache respects `skipCache`, but the BullMQ-backed
// dedup in BaseDataSource used to key jobs on a stable URL-derived jobId,
// so a second call returned the cached first result and the live Jellyseerr
// changes were invisible until the riven process restarted. After the fix
// both calls should reach the upstream.
it("does not BullMQ-dedupe back-to-back skipCache calls", async ({
  server,
  dataSourceMap,
}) => {
  let upstreamCalls = 0;

  server.use(
    http.get("**/settings/metadatas", () =>
      HttpResponse.json({ anime: "tvdb", tv: "tvdb" }),
    ),
    http.get("**/api/v1/request", () => {
      upstreamCalls += 1;

      return HttpResponse.json({
        pageInfo: { pages: 1, pageSize: 20, results: 0, page: 1 },
        results: [],
      });
    }),
  );

  const seerrApi = dataSourceMap.get(SeerrAPI);

  await seerrApi.getContent("approved");
  await seerrApi.getContent("approved");

  expect(upstreamCalls).toBe(2);
});
