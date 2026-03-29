import { DataSourceMap } from "@repo/util-plugin-sdk";
import { it } from "@repo/util-plugin-testing/plugin-test-context";

import { HttpResponse, http } from "msw";
import assert from "node:assert";
import { expect } from "vitest";

import { TmdbAPI } from "../../datasource/tmdb.datasource.ts";
import plugin from "../../index.ts";
import { pluginConfig } from "../../tmdb-plugin.config.ts";

it.override("plugin", plugin);

it('returns the validation status when calling "tmdbIsValid" query', async ({
  gqlServer,
  server,
  dataSourceConfig,
}) => {
  server.use(
    http.get("**/validate", () => HttpResponse.json({ success: true })),
  );

  const { body } = await gqlServer.executeOperation(
    {
      query: `
        query TmdbIsValid {
          tmdbIsValid
        }
      `,
    },
    {
      contextValue: {
        [pluginConfig.name]: {
          dataSources: new DataSourceMap([
            [
              TmdbAPI,
              new TmdbAPI({
                ...dataSourceConfig,
                pluginSymbol: pluginConfig.name,
                settings: {
                  apiKey: "",
                },
              }),
            ],
          ]),
        },
      },
    },
  );

  assert(body.kind === "single");

  expect(body.singleResult.errors).toBeUndefined();
  expect(body.singleResult.data?.["tmdbIsValid"]).toBe(true);
});
