import { rivenPluginPackageSchema } from "@repo/util-plugin-sdk";

import { expect, it, vi } from "vitest";
import { createActor, toPromise } from "xstate";
import z from "zod";

import { collectPluginsForRegistration } from "./collect-plugins-for-registration.actor.ts";

it("returns the installed plugins from the package.json file", async () => {
  const actor = createActor(collectPluginsForRegistration);
  const testPlugin = await import("@repo/plugin-test");

  const validatedPlugin = await rivenPluginPackageSchema.parseAsync(testPlugin);

  const plugins = await toPromise(actor.start());

  expect(plugins.validPlugins[0]?.name).toEqual(validatedPlugin.default.name);
});

it("returns any invalid plugins from the package.json file along with their validation result", async ({
  annotate,
}) => {
  await annotate(
    "This test requires a plugin that does not conform to the Riven plugin interface.",
  );

  const actor = createActor(collectPluginsForRegistration);

  vi.doMock(import("@repo/plugin-test"), () => {
    return {
      default: {
        name: "Plugin: Test",
      } as never,
    };
  });

  const validationResult = rivenPluginPackageSchema.safeParse(
    await import("@repo/plugin-test"),
  );

  const plugins = await toPromise(actor.start());

  expect(plugins).toEqual({
    invalidPlugins: [
      "@repo/plugin-test",
      z.treeifyError(validationResult.error as never),
    ],
    unresolvablePlugins: [],
    validPlugins: [],
  });
});
