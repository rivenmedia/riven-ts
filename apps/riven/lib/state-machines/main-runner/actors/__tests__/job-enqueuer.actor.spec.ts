import { DataSourceMap } from "@repo/util-plugin-sdk";

import { expect, vi } from "vitest";
import { createActor } from "xstate";

import { it } from "#__tests__/test-context.ts";
import { flow } from "#message-queue/flows/producer.ts";

import { jobEnqueuer } from "../job-enqueuer.actor.ts";

import type { PluginQueueMap, ValidPlugin } from "#types/plugins.ts";
import type { RivenPlugin } from "@repo/util-plugin-sdk";
import type { RivenEvent } from "@repo/util-plugin-sdk/events";
import type { Queue } from "bullmq";

const createPlugin = (name: string): [symbol, ValidPlugin] => {
  const symbol = Symbol(name);

  return [
    symbol,
    {
      config: { name: symbol } as RivenPlugin,
      dataSources: new DataSourceMap(),
      status: "valid",
    },
  ];
};

const eventQueues = (...entries: [RivenEvent["type"], Queue][]) =>
  new Map(entries);

const queueFor = (pluginName: string, event: string) =>
  ({ name: `plugin[${pluginName}]-${event}` }) as Queue;

it("enqueues the event for each plugin that has a queue for it", async () => {
  const addBulkSpy = vi.spyOn(flow, "addBulk").mockResolvedValue([]);
  const [subscribedSymbol, subscribedPlugin] = createPlugin("subscribed");
  const [otherSymbol, otherPlugin] = createPlugin("other");
  const [unsubscribedSymbol, unsubscribedPlugin] = createPlugin("unsubscribed");

  const pluginQueues: PluginQueueMap = new Map([
    [
      subscribedSymbol,
      eventQueues(["riven.core.started", queueFor("subscribed", "started")]),
    ],
    [
      otherSymbol,
      eventQueues(["riven.core.started", queueFor("other", "started")]),
    ],
    [
      unsubscribedSymbol,
      eventQueues([
        "riven.core.shutdown",
        queueFor("unsubscribed", "shutdown"),
      ]),
    ],
  ]);

  const actor = createActor(jobEnqueuer, {
    input: {
      plugins: new Map([
        [subscribedSymbol, subscribedPlugin],
        [otherSymbol, otherPlugin],
        [unsubscribedSymbol, unsubscribedPlugin],
      ]),
      pluginQueues,
    },
  }).start();

  actor.send({ type: "riven.core.started" });

  await vi.waitFor(() => {
    expect(addBulkSpy).toHaveBeenCalledExactlyOnceWith([
      {
        name: "riven.core.started",
        queueName: "plugin[subscribed]-started",
        data: {},
      },
      {
        name: "riven.core.started",
        queueName: "plugin[other]-started",
        data: {},
      },
    ]);
  });

  actor.stop();
});

it("does not enqueue an event that no plugin has a queue for", () => {
  const addBulkSpy = vi.spyOn(flow, "addBulk").mockResolvedValue([]);
  const [symbol, plugin] = createPlugin("plugin");

  const actor = createActor(jobEnqueuer, {
    input: {
      plugins: new Map([[symbol, plugin]]),
      pluginQueues: new Map([
        [
          symbol,
          eventQueues(["riven.core.shutdown", queueFor("plugin", "shutdown")]),
        ],
      ]),
    },
  }).start();

  actor.send({ type: "riven.core.started" });
  actor.stop();

  expect(addBulkSpy).not.toHaveBeenCalled();
});

it("keeps receiving events after failing to enqueue one", async () => {
  const addBulkSpy = vi
    .spyOn(flow, "addBulk")
    .mockRejectedValueOnce(new Error("Redis is unavailable"))
    .mockResolvedValue([]);
  const [symbol, plugin] = createPlugin("plugin");

  const actor = createActor(jobEnqueuer, {
    input: {
      plugins: new Map([[symbol, plugin]]),
      pluginQueues: new Map([
        [
          symbol,
          eventQueues(["riven.core.started", queueFor("plugin", "started")]),
        ],
      ]),
    },
  }).start();

  actor.send({ type: "riven.core.started" });
  actor.send({ type: "riven.core.started" });

  await vi.waitFor(() => {
    expect(addBulkSpy).toHaveBeenCalledTimes(2);
  });

  expect(actor.getSnapshot().status).toBe("active");

  actor.stop();
});
