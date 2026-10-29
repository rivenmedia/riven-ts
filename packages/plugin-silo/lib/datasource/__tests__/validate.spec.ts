import { HttpResponse, http } from "msw";
import { expect } from "vitest";

import { it } from "../../__tests__/silo.test-context.ts";
import { SiloAPI } from "../silo.datasource.ts";

it("returns false if the request fails", async ({ server, dataSourceMap }) => {
  server.use(
    http.get("**/api/v2/scan/capabilities", () =>
      HttpResponse.json({}, { status: 401 }),
    ),
  );

  const siloApi = dataSourceMap.get(SiloAPI);
  const isValid = await siloApi.validate();

  expect(isValid).toBe(false);
});

it("returns false if scanning is not configured", async ({
  server,
  dataSourceMap,
}) => {
  server.use(
    http.get("**/api/v2/scan/capabilities", () =>
      HttpResponse.json({ state: "not_configured", revision: "1" }),
    ),
  );

  const siloApi = dataSourceMap.get(SiloAPI);
  const isValid = await siloApi.validate();

  expect(isValid).toBe(false);
});

it("returns false if the API key is not allowed to scan", async ({
  server,
  dataSourceMap,
}) => {
  server.use(
    http.get("**/api/v2/scan/capabilities", () =>
      HttpResponse.json({ state: "available", allowed: false, revision: "1" }),
    ),
  );

  const siloApi = dataSourceMap.get(SiloAPI);
  const isValid = await siloApi.validate();

  expect(isValid).toBe(false);
});

it("returns true if scanning is available", async ({
  server,
  dataSourceMap,
}) => {
  server.use(
    http.get("**/api/v2/scan/capabilities", () =>
      HttpResponse.json({ state: "available", allowed: true, revision: "1" }),
    ),
  );

  const siloApi = dataSourceMap.get(SiloAPI);
  const isValid = await siloApi.validate();

  expect(isValid).toBe(true);
});
