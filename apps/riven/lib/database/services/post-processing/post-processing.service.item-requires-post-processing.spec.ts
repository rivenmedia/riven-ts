import { DataSourceMap } from "@repo/util-plugin-sdk";

import { expect, vi } from "vitest";

import { it } from "#__tests__/test-context.ts";

import type { ValidPluginMap } from "#types/plugins.ts";
import type { RivenPlugin } from "@repo/util-plugin-sdk";

type DownloadHook = NonNullable<
  RivenPlugin["hooks"]["riven.media-item.download.requested"]
>;
type SubtitleHook = NonNullable<
  RivenPlugin["hooks"]["riven.media-item.subtitle.requested"]
>;

const createPlugins = (...hooks: RivenPlugin["hooks"][]): ValidPluginMap =>
  new Map(
    hooks.map((pluginHooks, index) => {
      const name = Symbol.for(`@repo/plugin-${index.toString()}`);

      return [
        name,
        {
          config: { name, hooks: pluginHooks } as RivenPlugin,
          dataSources: new DataSourceMap(),
          status: "valid",
        },
      ];
    }),
  );

it("requires post-processing when a plugin subscribes to subtitle requests", ({
  completedMovieContext: { completedMovie },
  services: { postProcessingService },
}) => {
  const plugins = createPlugins(
    {
      "riven.media-item.download.requested": vi.fn<DownloadHook>(),
    },
    {
      "riven.media-item.subtitle.requested": vi.fn<SubtitleHook>(),
    },
  );

  expect(
    postProcessingService.itemRequiresPostProcessing(completedMovie, plugins),
  ).toBe(true);
});

it("does not require post-processing when no plugin subscribes to post-processing events", ({
  completedMovieContext: { completedMovie },
  services: { postProcessingService },
}) => {
  const plugins = createPlugins(
    {
      "riven.media-item.download.requested": vi.fn<DownloadHook>(),
    },
    {},
  );

  expect(
    postProcessingService.itemRequiresPostProcessing(completedMovie, plugins),
  ).toBe(false);
});
