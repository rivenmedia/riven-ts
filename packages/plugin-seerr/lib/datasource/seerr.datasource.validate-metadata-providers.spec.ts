import { FatalValidationError } from "@repo/util-plugin-sdk/errors/fatal-validation-error";

import { expect } from "vitest";

import { it } from "../__tests__/seerr.test-context.ts";
import {
  authenticated,
  metadataSettings,
} from "../__tests__/validate-fixtures.ts";
import { SeerrAPI } from "./seerr.datasource.ts";

it.for([
  { tv: "tmdb", anime: "tvdb" },
  { tv: "tvdb", anime: "tmdb" },
] as const)(
  "throws if the TV provider is $tv and the anime provider is $anime",
  async (settings, { server, dataSourceMap }) => {
    server.use(authenticated, metadataSettings(settings));

    await expect(dataSourceMap.get(SeerrAPI).validate()).rejects.toThrow(
      new FatalValidationError(
        `Invalid Seerr metadata provider settings. TV provider: ${settings.tv}, Anime provider: ${settings.anime}. Ensure both are set to TVDB at http://localhost:5055/settings/metadata or enable "autofixMetadataProviders" option in the plugin settings to have this automatically fixed by the plugin.`,
      ),
    );
  },
);
