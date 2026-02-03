import { it } from "@repo/core-util-vitest-test-context";

import { HttpResponse, http } from "msw";
import assert from "node:assert";
import { expect } from "vitest";

import { TmdbAPI } from "../../datasource/tmdb.datasource.ts";
import { pluginConfig } from "../../tmdb-plugin.config.ts";

it('returns the validation status when calling "tmdbIsValid" query', async ({
  gqlServer,
  httpCache,
  server,
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
          api: new TmdbAPI({ cache: httpCache }),
        },
      },
    },
  );

  assert(body.kind === "single");

  expect(body.singleResult.errors).toBeUndefined();
  expect(body.singleResult.data?.["tmdbIsValid"]).toBe(true);
});
