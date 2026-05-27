import { HttpResponse, http } from "msw";
import assert from "node:assert";
import { expect } from "vitest";

import { it } from "../../__tests__/newznab.test-context.ts";

it('returns the validation status when calling "newznabIsValid" query', async ({
  gqlContext,
  gqlServer,
  server,
}) => {
  server.use(http.get("**/api", () => HttpResponse.json({ caps: {} })));

  const { body } = await gqlServer.executeOperation(
    {
      query: `
        query NewznabIsValid {
          newznabIsValid
        }
      `,
    },
    { contextValue: gqlContext },
  );

  assert(body.kind === "single");

  expect(body.singleResult.errors).toBeUndefined();
  expect(body.singleResult.data?.["newznabIsValid"]).toBe(true);
});
