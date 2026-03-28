import { DataSourceMap } from "@repo/util-plugin-sdk";
import { it } from "@repo/util-plugin-testing/plugin-test-context";

import assert from "node:assert";
import { expect } from "vitest";

import { postLoginHandler } from "../../__generated__/index.ts";
import { TvdbAPI } from "../../datasource/tvdb.datasource.ts";
import plugin from "../../index.ts";
import { pluginConfig } from "../../tvdb-plugin.config.ts";

it.override("plugin", plugin);

it('returns the validation status when calling "tvdbIsValid" query', async ({
  gqlServer,
  server,
  dataSourceConfig,
}) => {
  server.use(postLoginHandler({ data: { token: "mock-token" } }));

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
          dataSources: new DataSourceMap([
            [
              TvdbAPI,
              new TvdbAPI({
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
  expect(body.singleResult.data?.["tvdbIsValid"]).toBe(true);
});
