import { it } from "@repo/core-util-vitest-test-context";

import { HttpResponse, http } from "msw";
import assert from "node:assert";
import { expect } from "vitest";

import { RealDebridAPI } from "../../datasource/realdebrid.datasource.ts";
import { pluginConfig } from "../../realdebrid-plugin.config.ts";

it('returns the validation status when calling "realdebridIsValid" query', async ({
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
        query RealDebridIsValid {
          realdebridIsValid
        }
      `,
    },
    {
      contextValue: {
        [pluginConfig.name]: {
          api: new RealDebridAPI({ cache: httpCache, token: "test-token" }),
        },
      },
    },
  );

  assert(body.kind === "single");

  expect(body.singleResult.errors).toBeUndefined();
  expect(body.singleResult.data?.["realdebridIsValid"]).toBe(true);
});
