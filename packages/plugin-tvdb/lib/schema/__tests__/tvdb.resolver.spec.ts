import { it } from "@repo/util-plugin-testing/plugin-test-context";

import { HttpResponse, http } from "msw";
import assert from "node:assert";
import { expect } from "vitest";

import { TvdbAPI } from "../../datasource/tvdb.datasource.ts";
import { pluginConfig } from "../../tvdb-plugin.config.ts";

it('returns the validation status when calling "tvdbIsValid" query', async ({
  gqlServer,
  httpCache,
  server,
  redisUrl,
}) => {
  server.use(
    http.get("**/validate", () => HttpResponse.json({ success: true })),
  );

  const { body } = await gqlServer.executeOperation(
    {
      query: `
        query TvdbIsValid {
          tvdbIsValid
        }
      `,
    },
    {
      contextValue: {
        [pluginConfig.name]: {
          api: new TvdbAPI({
            cache: httpCache,
            logger: {} as never,
            pluginSymbol: pluginConfig.name,
            connection: {
              url: redisUrl,
            },
            settings: {},
          }),
        },
      },
    },
  );

  assert(body.kind === "single");

  expect(body.singleResult.errors).toBeUndefined();
  expect(body.singleResult.data?.["tvdbIsValid"]).toBe(true);
});
