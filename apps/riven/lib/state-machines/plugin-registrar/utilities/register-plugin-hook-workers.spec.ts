import { DataSourceMap } from "@repo/util-plugin-sdk";

import { expect, vi } from "vitest";

import { it as baseIt } from "#__tests__/test-context.ts";
import { runSingleJob } from "#message-queue/utilities/run-single-job.ts";

import { registerPluginHookWorkers } from "./register-plugin-hook-workers.ts";

import type { ValidPluginMap } from "#types/plugins.ts";
import type { RivenPlugin } from "@repo/util-plugin-sdk";
import type { PluginSettings } from "@repo/util-plugin-sdk/utilities/plugin-settings";

type ProviderListHook = NonNullable<
  RivenPlugin["hooks"]["riven.media-item.download.provider-list-requested"]
>;

const pluginName = Symbol.for("@repo/plugin-hooks");

// The settings are passed through to the hook untouched
const settings = { label: "plugin settings" } as unknown as PluginSettings;

const it = baseIt.extend("register", ({}, { onCleanup }) => {
  const registered: ReturnType<typeof registerPluginHookWorkers>[] = [];

  onCleanup(async () => {
    for (const { pluginQueues, pluginWorkers } of registered) {
      for (const workers of pluginWorkers.values()) {
        for (const worker of workers.values()) {
          await worker.close();
        }
      }

      for (const queues of pluginQueues.values()) {
        for (const queue of queues.values()) {
          await queue.close();
        }
      }
    }
  });

  return (hooks: RivenPlugin["hooks"]) => {
    const dataSources = new DataSourceMap();
    const plugins: ValidPluginMap = new Map([
      [
        pluginName,
        {
          config: { name: pluginName, hooks } as RivenPlugin,
          dataSources,
          status: "valid",
        },
      ],
    ]);

    const result = registerPluginHookWorkers(plugins, settings);

    registered.push(result);

    return { ...result, dataSources };
  };
});

it("registers a queue and worker for each hook the plugin implements", ({
  register,
}) => {
  const { pluginQueues, pluginWorkers, publishableEvents } = register({
    "riven.media-item.download.provider-list-requested":
      vi.fn<ProviderListHook>(),
    "riven.media-item.download.requested": undefined,
  });

  expect([...publishableEvents]).toStrictEqual([
    "riven.media-item.download.provider-list-requested",
  ]);
  expect([...(pluginQueues.get(pluginName)?.keys() ?? [])]).toStrictEqual([
    "riven.media-item.download.provider-list-requested",
  ]);
  expect([...(pluginWorkers.get(pluginName)?.keys() ?? [])]).toStrictEqual([
    "riven.media-item.download.provider-list-requested",
  ]);
});

it("registers no workers for a plugin without hooks", ({ register }) => {
  const { pluginQueues, pluginWorkers, publishableEvents } = register({});

  expect(publishableEvents.size).toBe(0);
  expect(pluginQueues.get(pluginName)?.size).toBe(0);
  expect(pluginWorkers.get(pluginName)?.size).toBe(0);
});

it("runs the plugin's hook with its data sources and settings for each job", async ({
  register,
}) => {
  const hook = vi.fn<ProviderListHook>().mockResolvedValue({
    providers: ["alpha"],
    rateLimitedProviders: {},
  });

  const { pluginQueues, dataSources } = register({
    "riven.media-item.download.provider-list-requested": hook,
  });

  const queue = pluginQueues
    .get(pluginName)
    ?.get("riven.media-item.download.provider-list-requested");

  expect.assert(queue);

  const job = await queue.add("Get provider list", {});

  await expect(runSingleJob(job)).resolves.toStrictEqual({
    providers: ["alpha"],
    rateLimitedProviders: {},
  });

  expect(hook).toHaveBeenCalledExactlyOnceWith(
    expect.objectContaining({ event: {}, dataSources, settings }),
  );
});
