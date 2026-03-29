import assert from "node:assert";
import { expect } from "vitest";

import { postLoginHandler } from "../../__generated__/index.ts";
import { it } from "../../__tests__/tvdb.test-context.ts";

it('returns the validation status when calling "tvdbIsValid" query', async ({
  gqlContext,
  gqlServer,
  server,
}) => {
  server.use(postLoginHandler({ data: { token: "mock-token" } }));

  const { body } = await gqlServer.executeOperation(
    {
      query: `
        query TvdbIsValid {
          tvdbIsValid
        }
      `,
    },
    { contextValue: gqlContext },
  );

  assert(body.kind === "single");

  expect(body.singleResult.errors).toBeUndefined();
  expect(body.singleResult.data?.["tvdbIsValid"]).toBe(true);
});
