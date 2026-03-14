import { it } from "@repo/util-plugin-testing/plugin-test-context";

import { HttpResponse, http } from "msw";
import assert from "node:assert";
import { expect } from "vitest";

import { StremThruAPI } from "../../datasource/stremthru.datasource.ts";
import { pluginConfig } from "../../stremthru-plugin.config.ts";

it('returns the validation status when calling "stremthruIsValid" query', async ({
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
        query StremThruIsValid {
          stremThruIsValid
        }
      `,
    },
    {
      contextValue: {
        [pluginConfig.name]: {
          api: new StremThruAPI({
            ...dataSourceConfig,
            pluginSymbol: Symbol("@repo/plugin-stremthru"),
            settings: {
              stremThruUrl: "https://stremthru.13377001.xyz/",
            },
          }),
        },
      },
    },
  );

  assert(body.kind === "single");

  expect(body.singleResult.errors).toBeUndefined();
  expect(body.singleResult.data?.["stremThruIsValid"]).toBe(true);
});
