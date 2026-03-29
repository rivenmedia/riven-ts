import { it } from "@repo/util-plugin-testing/plugin-test-context";

import { HttpResponse, http } from "msw";
import { expect } from "vitest";

import {
  createGetAuthMeQueryResponse,
  getAuthMeHandler,
} from "../../__generated__/index.ts";
import { MetadataSettingsResponse } from "../../schemas/metadata-settings-response.schema.ts";
import { pluginConfig } from "../../seerr-plugin.config.ts";
import { SeerrAPI } from "../seerr.datasource.ts";

it("returns false if the request fails", async ({
  server,
  dataSourceConfig,
}) => {
  server.use(
    getAuthMeHandler(() => HttpResponse.error()),
    http.get("**/settings/metadatas", () =>
      HttpResponse.json<MetadataSettingsResponse>({
        anime: "tvdb",
        tv: "tvdb",
      }),
    ),
  );

  const seerrApi = new SeerrAPI({
    ...dataSourceConfig,
    pluginSymbol: pluginConfig.name,
    settings: {
      apiKey: "test-api-key",
      url: "http://localhost:5055",
      filter: "approved",
    },
  });

  const isValid = await seerrApi.validate();

  expect(isValid).toBe(false);
});

it("returns true if the request succeeds", async ({
  server,
  dataSourceConfig,
}) => {
  server.use(
    getAuthMeHandler(() => HttpResponse.json(createGetAuthMeQueryResponse())),
    http.get("**/settings/metadatas", () =>
      HttpResponse.json<MetadataSettingsResponse>({
        anime: "tvdb",
        tv: "tvdb",
      }),
    ),
  );

  const seerrApi = new SeerrAPI({
    ...dataSourceConfig,
    pluginSymbol: pluginConfig.name,
    settings: {
      apiKey: "test-api-key",
      url: "http://localhost:5055",
      filter: "approved",
    },
  });

  const isValid = await seerrApi.validate();

  expect(isValid).toBe(true);
});
