import { DataSourceMap } from "@repo/util-plugin-sdk";
import { it } from "@repo/util-plugin-testing/plugin-test-context";

import { HttpResponse, http } from "msw";
import assert from "node:assert";
import { expect } from "vitest";

import { StremThruAPI } from "../../datasource/stremthru.datasource.ts";
import plugin from "../../index.ts";
import { pluginConfig } from "../../stremthru-plugin.config.ts";

it.override("plugin", plugin);

it('returns the validation status when calling "stremthruIsValid" query', async ({
  gqlServer,
  server,
  dataSourceConfig,
}) => {
  server.use(
    http.get("**/v0/torznab/api", () => HttpResponse.json({ success: true })),
  );

  const { body } = await gqlServer.executeOperation(
    {
      query: `
        query StremThruIsValid {
          stremthruIsValid
        }
      `,
    },
    {
      contextValue: {
        [pluginConfig.name]: {
          dataSources: new DataSourceMap([
            [
              StremThruAPI,
              new StremThruAPI({
                ...dataSourceConfig,
                pluginSymbol: pluginConfig.name,
                settings: {
                  stremThruUrl: "https://stremthru.13377001.xyz/",
                  realdebridApiKey: "1234",
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
  expect(body.singleResult.data?.["stremthruIsValid"]).toBe(true);
});
