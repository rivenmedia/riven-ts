import { expect, vi } from "vitest";

import { it } from "../../../__tests__/test-context.ts";

import type { ValidPlugin } from "../../../types/plugins.ts";

const testPluginSymbol = Symbol.for("@repo/plugin-test");

function createTestPluginMap(hooks: Record<string, unknown> = {}) {
  const plugin: ValidPlugin = {
    status: "valid",
    config: {
      name: { description: "@repo/plugin-test" },
      hooks,
    } as never,
    dataSources: new Map() as never,
  };

  return new Map([[testPluginSymbol, plugin]]);
}

it("returns true when subtitle plugins are available", async ({
  services: { postProcessingService },
  seeders: { seedCompletedMovie },
}) => {
  const { movie } = await seedCompletedMovie();

  const plugins = createTestPluginMap({
    "riven.media-item.subtitle.requested": vi.fn(),
  });

  expect(postProcessingService.itemRequiresPostProcessing(movie, plugins)).toBe(
    true,
  );
});

it("returns false when no post-processing plugins are available", async ({
  services: { postProcessingService },
  seeders: { seedCompletedMovie },
}) => {
  const { movie } = await seedCompletedMovie();

  expect(
    postProcessingService.itemRequiresPostProcessing(movie, new Map()),
  ).toBe(false);
});
