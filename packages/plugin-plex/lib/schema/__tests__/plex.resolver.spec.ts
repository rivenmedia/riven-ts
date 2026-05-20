import { HttpResponse, http } from "msw";
import assert from "node:assert";
import { expect } from "vitest";

import { it } from "../../__tests__/plex.test-context.ts";
import { LibrarySectionsResponse } from "../../schemas/library-sections-response.schema.ts";

it('returns the validation status when calling "plexIsValid" query', async ({
  server,
  gqlContext,
  gqlServer,
}) => {
  server.use(
    http.get("*/library/sections", () =>
      HttpResponse.json<LibrarySectionsResponse>({
        MediaContainer: {
          Directory: [],
        },
      }),
    ),
  );

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
