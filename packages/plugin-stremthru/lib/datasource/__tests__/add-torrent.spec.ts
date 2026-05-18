import { HttpResponse, http } from "msw";
import { expect } from "vitest";

import { it } from "../../__tests__/stremthru.test-context.ts";
import { StremThruTorzAPI } from "../stremthru-torz.datasource.ts";

const infoHash = "0000000000000000000000000000000000000000";

it("throws a cooldown error when stremthru returns a cooldown_until field", async ({
  server,
  dataSourceMap,
}) => {
  const cooldownUntil = "2099-12-31T23:59:59Z";

  server.use(
    http.post("**/v0/store/torz", () =>
      HttpResponse.json({
        data: null,
        cooldown_until: cooldownUntil,
      }),
    ),
  );

  const api = dataSourceMap.get(StremThruTorzAPI);

  await expect(api.addTorrent(infoHash, "torbox")).rejects.toThrow(
    `torbox is in cooldown until ${cooldownUntil}`,
  );
});

it("includes the raw response body in the no-data error", async ({
  server,
  dataSourceMap,
}) => {
  server.use(
    http.post("**/v0/store/torz", () =>
      HttpResponse.json({
        data: null,
        request_id: "abc-123",
      }),
    ),
  );

  const api = dataSourceMap.get(StremThruTorzAPI);

  // The error message should surface the request_id so cooldown / debug
  // information that arrives in unexpected shapes still reaches operators.
  await expect(api.addTorrent(infoHash, "torbox")).rejects.toThrow(
    /"request_id":"abc-123"/,
  );
});
