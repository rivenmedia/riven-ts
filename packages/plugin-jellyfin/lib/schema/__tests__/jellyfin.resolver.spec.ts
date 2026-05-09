import { HttpResponse, http } from "msw";
import assert from "node:assert";
import { expect } from "vitest";

import { it } from "../../__tests__/jellyfin.test-context.ts";

it('returns the validation status when calling "jellyfinIsValid" query', async ({
  gqlContext,
  gqlServer,
  server,
}) => {
  server.use(http.get("**/System/Configuration", () => HttpResponse.json({})));

  const { body } = await gqlServer.executeOperation(
    {
      query: `
        query JellyfinIsValid {
          jellyfinIsValid
        }
      `,
    },
    { contextValue: gqlContext },
  );

  assert(body.kind === "single");

  expect(body.singleResult.errors).toBeUndefined();
  expect(body.singleResult.data?.["jellyfinIsValid"]).toBe(true);
});
