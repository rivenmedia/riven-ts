import { it } from "@repo/util-plugin-testing/plugin-test-context";

import { HttpResponse, http } from "msw";
import assert from "node:assert";
import { expect } from "vitest";

import { PlexAPI } from "../../datasource/plex.datasource.ts";
import { pluginConfig } from "../../plex-plugin.config.ts";

it('returns the validation status when calling "plexIsValid" query', async ({
  gqlServer,
  dataSourceConfig,
  server,
}) => {
  server.use(
    http.get("**/validate", () => HttpResponse.json({ success: true })),
  );

  const { body } = await gqlServer.executeOperation(
    {
      query: `
        query PlexIsValid {
          plexIsValid
        }
      `,
    },
    {
      contextValue: {
        [pluginConfig.name]: {
          api: new PlexAPI({
            ...dataSourceConfig,
            pluginSymbol: Symbol("@repo/plugin-plex"),
            settings: {
              plexLibraryPath: "",
              plexServerUrl: "",
              plexToken: "",
            },
          }),
        },
      },
    },
  );

  assert(body.kind === "single");

  expect(body.singleResult.errors).toBeUndefined();
  expect(body.singleResult.data?.["plexIsValid"]).toBe(true);
});
