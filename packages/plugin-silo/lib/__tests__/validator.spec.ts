import { expect, vi } from "vitest";

import { SiloAPI } from "../datasource/silo.datasource.ts";
import { it } from "./silo.test-context.ts";

it("delegates validation to the Silo datasource", async ({
  dataSourceMap,
  plugin,
  settings,
}) => {
  expect.assert(plugin.validator);

  const validate = vi
    .spyOn(dataSourceMap.get(SiloAPI), "validate")
    .mockResolvedValueOnce(false);

  await expect(
    plugin.validator({ dataSources: dataSourceMap, settings }),
  ).resolves.toBe(false);

  expect(validate).toHaveBeenCalledOnce();
});
