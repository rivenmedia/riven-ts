import assert from "node:assert";
import { TestAPI } from "../../datasource/test.datasource.ts";
import { pluginConfig } from "../../test-plugin.config.ts";
import { it } from "@repo/core-util-vitest-test-context";
import { expect } from "vitest";
import { http, HttpResponse } from "msw";

it('returns the validation status when calling "testIsValid" query', async ({
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
        query TestIsValid {
          testIsValid
        }
      `,
    },
    {
      contextValue: {
        [pluginConfig.name]: {
          api: new TestAPI({ cache: httpCache, token: "test-token" }),
        },
      },
    },
  );

  assert(body.kind === "single");

  expect(body.singleResult.errors).toBeUndefined();
  expect(body.singleResult.data?.["testIsValid"]).toBe(true);
});
