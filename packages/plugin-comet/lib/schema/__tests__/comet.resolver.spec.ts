import { HttpResponse, http } from "msw";
import assert from "node:assert";
import { expect } from "vitest";

import { it } from "../../__tests__/comet.test-context.ts";

it('returns the validation status when calling "cometIsValid" query', async ({
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
        query CometIsValid {
          cometIsValid
        }
      `,
    },
    { contextValue: gqlContext },
  );

  assert(body.kind === "single");

  expect(body.singleResult.errors).toBeUndefined();
  expect(body.singleResult.data?.["cometIsValid"]).toBe(true);
});
