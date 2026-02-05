import { it } from "@repo/util-plugin-testing/plugin-test-context";

import { HttpResponse, http } from "msw";
import assert from "node:assert";
import { expect } from "vitest";

import { TestAPI } from "../../datasource/test.datasource.ts";
import { pluginConfig } from "../../test-plugin.config.ts";

it('returns the validation status when calling "testIsValid" query', async ({
  gqlServer,
  httpCache,
  server,
  redisUrl,
}) => {
  server.use(
    http.get("**/validate", () => HttpResponse.json({ success: true })),
  );

  const { body } = await gqlServer.executeOperation(
    {
      query: `
        query TestIsValid {
          testIsValid
        }
      `,
    },
    {
      contextValue: {
        [pluginConfig.name]: {
          api: new TestAPI({
            cache: httpCache,
            pluginSymbol: Symbol("@repo/plugin-test"),
            logger: {} as never,
            connection: {
              url: redisUrl,
            },
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
  expect(body.singleResult.data?.["testIsValid"]).toBe(true);
});
