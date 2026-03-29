import { HttpResponse, http } from "msw";
import assert from "node:assert";
import { expect } from "vitest";

import { it } from "../../__tests__/test.test-context.ts";

it('returns the validation status when calling "testIsValid" query', async ({
  gqlContext,
  gqlServer,
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
    { contextValue: gqlContext },
  );

  assert(body.kind === "single");

  expect(body.singleResult.errors).toBeUndefined();
  expect(body.singleResult.data?.["testIsValid"]).toBe(true);
});
