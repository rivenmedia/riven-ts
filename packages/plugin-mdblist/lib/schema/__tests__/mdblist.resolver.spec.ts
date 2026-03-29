import { DataSourceMap } from "@repo/util-plugin-sdk";
import { it } from "@repo/util-plugin-testing/plugin-test-context";

import { HttpResponse, http } from "msw";
import assert from "node:assert";
import { expect } from "vitest";

import { MdblistAPI } from "../../datasource/mdblist.datasource.ts";
import plugin from "../../index.ts";
import { pluginConfig } from "../../mdblist-plugin.config.ts";

it.override("plugin", plugin);

it('returns the validation status when calling "mdblistIsValid" query', async ({
  gqlServer,
  dataSourceConfig,
  server,
}) => {
  server.use(http.get("**/user", () => HttpResponse.json({ success: true })));

  const { body } = await gqlServer.executeOperation(
    {
      query: `
        query MdblistIsValid {
          mdblistIsValid
        }
      `,
    },
    {
      contextValue: {
        [pluginConfig.name]: {
          dataSources: new DataSourceMap([
            [
              MdblistAPI,
              new MdblistAPI({
                ...dataSourceConfig,
                pluginSymbol: pluginConfig.name,
                settings: { apiKey: "test-api-key", lists: [] },
              }),
            ],
          ]),
        },
      },
    },
  );

  assert(body.kind === "single");

  expect(body.singleResult.errors).toBeUndefined();
  expect(body.singleResult.data?.["mdblistIsValid"]).toBe(true);
});
