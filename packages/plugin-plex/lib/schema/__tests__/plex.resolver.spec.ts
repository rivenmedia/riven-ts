import { DataSourceMap } from "@repo/util-plugin-sdk";
import { it } from "@repo/util-plugin-testing/plugin-test-context";

import assert from "node:assert";
import { expect } from "vitest";

import { PlexAPI } from "../../datasource/plex.datasource.ts";
import plugin from "../../index.ts";
import { pluginConfig } from "../../plex-plugin.config.ts";

it.override("plugin", plugin);

it('returns the validation status when calling "plexIsValid" query', async ({
  gqlServer,
  dataSourceConfig,
}) => {
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
          dataSources: new DataSourceMap([
            [
              PlexAPI,
              new PlexAPI({
                ...dataSourceConfig,
                pluginSymbol: pluginConfig.name,
                settings: {
                  plexLibraryPath: "",
                  plexServerUrl: "",
                  plexToken: "",
                },
              }),
            ],
          ]),
        },
      },
    },
  );

  assert(body.kind === "single");

  expect(body.singleResult.errors).toBeUndefined();
  expect(body.singleResult.data?.["plexIsValid"]).toBe(true);
});
