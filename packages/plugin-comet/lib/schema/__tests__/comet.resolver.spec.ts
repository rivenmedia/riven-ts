import { DataSourceMap } from "@repo/util-plugin-sdk";
import { it } from "@repo/util-plugin-testing/plugin-test-context";

import { HttpResponse, http } from "msw";
import assert from "node:assert";
import { expect } from "vitest";

import { pluginConfig } from "../../comet-plugin.config.ts";
import { CometAPI } from "../../datasource/comet.datasource.ts";
import plugin from "../../index.ts";

it.override("plugin", plugin);

it('returns the validation status when calling "cometIsValid" query', async ({
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
        query CometIsValid {
          cometIsValid
        }
      `,
    },
    {
      contextValue: {
        [pluginConfig.name]: {
          dataSources: new DataSourceMap([
            [
              CometAPI,
              new CometAPI({
                ...dataSourceConfig,
                pluginSymbol: pluginConfig.name,
                settings: {
                  url: "http://localhost",
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
  expect(body.singleResult.data?.["cometIsValid"]).toBe(true);
});
