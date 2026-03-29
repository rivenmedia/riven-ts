import { HttpResponse, http } from "msw";
import assert from "node:assert";
import { expect } from "vitest";

import { it } from "../../__tests__/stremthru.test-context.ts";

it('returns the validation status when calling "stremthruIsValid" query', async ({
  gqlContext,
  gqlServer,
  server,
}) => {
  server.use(
    http.get("**/v0/torznab/api", () => HttpResponse.json({ success: true })),
  );

  const { body } = await gqlServer.executeOperation(
    {
      query: `
        query StremThruIsValid {
          stremthruIsValid
        }
      `,
    },
    { contextValue: gqlContext },
  );

  assert(body.kind === "single");

  expect(body.singleResult.errors).toBeUndefined();
  expect(body.singleResult.data?.["stremthruIsValid"]).toBe(true);
});
