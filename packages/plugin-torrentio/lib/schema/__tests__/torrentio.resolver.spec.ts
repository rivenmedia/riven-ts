import { it } from "@repo/core-util-vitest-test-context";

import { HttpResponse, http } from "msw";
import assert from "node:assert";
import { expect } from "vitest";

import { TorrentioAPI } from "../../datasource/torrentio.datasource.ts";
import { pluginConfig } from "../../torrentio-plugin.config.ts";

it('returns the validation status when calling "torrentioIsValid" query', async ({
  gqlServer,
  httpCache,
  server,
}) => {
  server.use(
    http.get("**/validate", () => HttpResponse.json({ success: true })),
  );

  const { body } = await gqlServer.executeOperation(
    {
      query: `
        query TorrentioIsValid {
          torrentioIsValid
        }
      `,
    },
    {
      contextValue: {
        [pluginConfig.name]: {
          api: new TorrentioAPI({ cache: httpCache }),
        },
      },
    },
  );

  assert(body.kind === "single");

  expect(body.singleResult.errors).toBeUndefined();
  expect(body.singleResult.data?.["torrentioIsValid"]).toBe(true);
});
