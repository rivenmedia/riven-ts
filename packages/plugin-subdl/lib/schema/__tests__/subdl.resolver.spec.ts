import { it } from "@repo/util-plugin-testing/plugin-test-context";

import { HttpResponse, http } from "msw";
import assert from "node:assert";
import { expect } from "vitest";

import { SubdlAPI } from "../../datasource/subdl.datasource.ts";
import { pluginConfig } from "../../subdl-plugin.config.ts";

it('returns the validation status when calling "subdlIsValid" query', async ({
  gqlServer,
  server,
  dataSourceConfig,
}) => {
  server.use(
    http.get("https://api.subdl.com/api/v1/subtitles", () =>
      HttpResponse.json({
        status: true,
        results: [{ sd_id: 123456, name: "Inception" }],
        subtitles: [],
      }),
    ),
  );

  const { body } = await gqlServer.executeOperation(
    {
      query: `
        query SubdlIsValid {
          subdlIsValid
        }
      `,
    },
    {
      contextValue: {
        [pluginConfig.name]: {
          api: new SubdlAPI({
            ...dataSourceConfig,
            pluginSymbol: pluginConfig.name,
            settings: { apiKey: "test-key", languages: ["en"] },
          }),
        },
      },
    },
  );

  assert(body.kind === "single");

  expect(body.singleResult.errors).toBeUndefined();
  expect(body.singleResult.data?.["subdlIsValid"]).toBe(true);
});
