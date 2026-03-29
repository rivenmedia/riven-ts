import assert from "node:assert";
import { expect } from "vitest";

import { it } from "../../__tests__/plex.test-context.ts";

it('returns the validation status when calling "plexIsValid" query', async ({
  gqlContext,
  gqlServer,
}) => {
  const { body } = await gqlServer.executeOperation(
    {
      query: `
        query PlexIsValid {
          plexIsValid
        }
      `,
    },
    { contextValue: gqlContext },
  );

  assert(body.kind === "single");

  expect(body.singleResult.errors).toBeUndefined();
  expect(body.singleResult.data?.["plexIsValid"]).toBe(true);
});
