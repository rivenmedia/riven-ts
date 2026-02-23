import { it } from "@repo/util-plugin-testing";

import { HttpResponse, http } from "msw";
import assert from "node:assert";
import { expect } from "vitest";

import { MdblistAPI } from "../../datasource/mdblist.datasource.ts";
import { pluginConfig } from "../../mdblist-plugin.config.ts";

it('returns the validation status when calling "mdblistIsValid" query', async ({
  gqlServer,
  httpCache,
  server,
}) => {
  server.use(http.get("**/user", () => HttpResponse.json({ success: true })));

  const { body } = await gqlServer.executeOperation(
    {
      query: `
        query MdblistIsValid {
          mdblistIsValid
        }
      `,
    },
    {
      contextValue: {
        [pluginConfig.name]: {
          api: new MdblistAPI({ cache: httpCache, token: "test-token" }),
        },
      },
    },
  );

  assert(body.kind === "single");

  expect(body.singleResult.errors).toBeUndefined();
  expect(body.singleResult.data?.["mdblistIsValid"]).toBe(true);
});
