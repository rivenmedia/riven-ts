import { readFile } from "node:fs/promises";
import path from "node:path";
import { expect, it } from "vitest";

import frontendPackageJson from "../../package.json" with { type: "json" };
import { pluginUiRegistry } from "./plugin-ui-registry.ts";

const PLUGIN_PACKAGE_PREFIX = "@repo/plugin-";

async function readPluginPackageJson(packageName: string) {
  const packageJson = await readFile(
    path.join(
      import.meta.dirname,
      "../../node_modules",
      packageName,
      "package.json",
    ),
    "utf8",
  );

  return JSON.parse(packageJson) as { exports?: Record<string, unknown> };
}

it("registers the UI of every plugin dependency that provides one", async () => {
  const pluginsWithUi: string[] = [];

  for (const packageName of Object.keys(frontendPackageJson.dependencies)) {
    if (!packageName.startsWith(PLUGIN_PACKAGE_PREFIX)) {
      continue;
    }

    const { exports } = await readPluginPackageJson(packageName);

    if (exports && "./ui" in exports) {
      pluginsWithUi.push(packageName.slice(PLUGIN_PACKAGE_PREFIX.length));
    }
  }

  expect(Object.keys(pluginUiRegistry).toSorted()).toStrictEqual(
    pluginsWithUi.toSorted(),
  );
});
