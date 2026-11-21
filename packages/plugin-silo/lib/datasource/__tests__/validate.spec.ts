import { HttpResponse, http } from "msw";
import { expect, vi } from "vitest";

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
  logger,
}) => {
  const errorLog = vi.spyOn(logger, "error");

  server.use(
    http.get("**/api/v2/scan/capabilities", () =>
      HttpResponse.json({ state: "not_configured", revision: "1" }),
    ),
  );

  const siloApi = dataSourceMap.get(SiloAPI);
  const isValid = await siloApi.validate();

  expect(isValid).toBe(false);
  expect(errorLog).toHaveBeenCalledOnce();
});

it("returns false if the API key is not allowed to scan", async ({
  server,
  dataSourceMap,
  logger,
}) => {
  const errorLog = vi.spyOn(logger, "error");

  server.use(
    http.get("**/api/v2/scan/capabilities", () =>
      HttpResponse.json({ state: "available", allowed: false, revision: "1" }),
    ),
  );

  const siloApi = dataSourceMap.get(SiloAPI);
  const isValid = await siloApi.validate();

  expect(isValid).toBe(false);
  expect(errorLog).toHaveBeenCalledOnce();
});

it("returns false if the response is not a capabilities payload", async ({
  server,
  dataSourceMap,
}) => {
  server.use(
    http.get("**/api/v2/scan/capabilities", () =>
      HttpResponse.json({ allowed: true }),
    ),
  );

  await expect(dataSourceMap.get(SiloAPI).validate()).resolves.toBe(false);
});

it("returns true if the server does not report whether the key is allowed", async ({
  server,
  dataSourceMap,
}) => {
  server.use(
    http.get("**/api/v2/scan/capabilities", () =>
      HttpResponse.json({ state: "available" }),
    ),
  );

  await expect(dataSourceMap.get(SiloAPI).validate()).resolves.toBe(true);
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
