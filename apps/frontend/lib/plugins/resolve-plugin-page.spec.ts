import { expect, it, vi } from "vitest";

import { resolvePluginPage } from "./resolve-plugin-page.ts";

import type { PluginUiRegistry } from "./plugin-ui-registry.ts";

const TestPage = () => null;

const registry: PluginUiRegistry = {
  test: async () =>
    Promise.resolve({
      ui: {
        pages: {
          "items/[id]": { load: async () => Promise.resolve(TestPage) },
        },
      },
    }),
};

it("resolves a page from a registered plugin", async () => {
  const resolvedPage = await resolvePluginPage(
    "test",
    ["items", "123"],
    registry,
  );

  expect(resolvedPage).toStrictEqual({
    route: "items/[id]",
    page: { load: expect.any(Function) },
    params: { id: "123" },
  });
  await expect(resolvedPage?.page.load()).resolves.toBe(TestPage);
});

it("returns undefined for a route the plugin doesn't provide", async () => {
  await expect(
    resolvePluginPage("test", ["unknown"], registry),
  ).resolves.toBeUndefined();
});

it.for(["unknown", "toString", "__proto__"])(
  'returns undefined for the unregistered plugin "%s"',
  async (pluginName) => {
    await expect(
      resolvePluginPage(pluginName, [], registry),
    ).resolves.toBeUndefined();
  },
);

it("only loads the UI of the requested plugin", async () => {
  const loadOtherPluginUi = vi.fn<PluginUiRegistry[string]>();

  await resolvePluginPage("test", ["items", "123"], {
    ...registry,
    other: loadOtherPluginUi,
  });

  expect(loadOtherPluginUi).not.toHaveBeenCalled();
});
