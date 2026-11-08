import { http, HttpResponse } from "msw";
import assert from "node:assert";
import { expect } from "vitest";

import { it } from "../../__tests__/silo.test-context.ts";

it('returns the validation status when calling "siloIsValid" query', async ({
  gqlContext,
  gqlServer,
  server,
}) => {
  server.use(
    http.get("**/api/v2/scan/capabilities", () =>
      HttpResponse.json({ state: "available", allowed: true, revision: "1" }),
    ),
  );

  const { body } = await gqlServer.executeOperation(
    {
      query: `
        query SiloIsValid {
          siloIsValid
        }
      `,
    },
    { contextValue: gqlContext },
  );

  assert.ok(body.kind === "single");

  expect(body.singleResult.errors).toBeUndefined();
  expect(body.singleResult.data?.["siloIsValid"]).toBe(true);
});
