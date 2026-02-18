import { it } from "@repo/util-plugin-testing/plugin-test-context";

import { HttpResponse, http } from "msw";
import assert from "node:assert";
import { expect } from "vitest";

import { RealDebridAPI } from "../../datasource/realdebrid.datasource.ts";
import { pluginConfig } from "../../realdebrid-plugin.config.ts";

it('returns the validation status when calling "realdebridIsValid" query', async ({
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
        query RealDebridIsValid {
          realdebridIsValid
        }
      `,
    },
    {
      contextValue: {
        [pluginConfig.name]: {
          api: new RealDebridAPI({
            ...dataSourceConfig,
            pluginSymbol: Symbol("@repo/plugin-realdebrid"),
            settings: {
              apiKey: "",
            },
          }),
        },
      },
    },
  );

  assert(body.kind === "single");

  expect(body.singleResult.errors).toBeUndefined();
  expect(body.singleResult.data?.["realdebridIsValid"]).toBe(true);
});
