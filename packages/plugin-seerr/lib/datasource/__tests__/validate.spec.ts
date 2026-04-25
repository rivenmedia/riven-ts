import { HttpResponse, http } from "msw";
import { expect } from "vitest";

import { getAuthMeHandler } from "../../__generated__/handlers/getAuthMeHandler.ts";
import { createGetAuthMeQueryResponse } from "../../__generated__/mocks/createGetAuthMe.ts";
import { it } from "../../__tests__/seerr.test-context.ts";
import { MetadataSettingsResponse } from "../../schemas/metadata-settings-response.schema.ts";
import { SeerrAPI } from "../seerr.datasource.ts";

it("returns false if the request fails", async ({ server, dataSourceMap }) => {
  server.use(
    getAuthMeHandler(() => HttpResponse.error()),
    http.get("**/settings/metadatas", () =>
      HttpResponse.json<MetadataSettingsResponse>({
        anime: "tvdb",
        tv: "tvdb",
      }),
    ),
  );

  const seerrApi = dataSourceMap.get(SeerrAPI);
  const isValid = await seerrApi.validate();

  expect(isValid).toBe(false);
});

it("returns true if the request succeeds", async ({
  server,
  dataSourceMap,
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

  const seerrApi = dataSourceMap.get(SeerrAPI);

  const isValid = await seerrApi.validate();

  expect(isValid).toBe(true);
});
