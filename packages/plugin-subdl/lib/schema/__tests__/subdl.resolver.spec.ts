import { HttpResponse, http } from "msw";
import assert from "node:assert";
import { expect } from "vitest";

import { it } from "../../__tests__/subdl.test-context.ts";
import { pluginConfig } from "../../subdl-plugin.config.ts";

it('returns the validation status when calling "subdlIsValid" query', async ({
  gqlServer,
  server,
  dataSourceMap,
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
          dataSources: dataSourceMap,
        },
      },
    },
  );

  assert(body.kind === "single");

  expect(body.singleResult.errors).toBeUndefined();
  expect(body.singleResult.data?.["subdlIsValid"]).toBe(true);
});
