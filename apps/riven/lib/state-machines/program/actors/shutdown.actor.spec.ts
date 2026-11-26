import { DataSourceMap } from "@repo/util-plugin-sdk";

import { expect, it as baseIt, vi } from "vitest";
import { createActor, toPromise } from "xstate";

import { keyvInstance } from "#utilities/redis-cache.ts";

import { shutdown } from "./shutdown.actor.ts";

import type { ShutdownInput } from "./shutdown.actor.ts";

type CloseFn = (force?: boolean) => Promise<void>;

const runShutdown = async (mainRunnerRef: ShutdownInput["mainRunnerRef"]) =>
  toPromise(createActor(shutdown, { input: { mainRunnerRef } }).start());

const it = baseIt
  .extend(
    "spyOnKeyvDisconnect",
    () => () => vi.spyOn(keyvInstance, "disconnect"),
  )
  .extend(
    "createWorker",
    () =>
      (name: string, close: CloseFn = async () => Promise.resolve()) => ({
        name,
        close: vi.fn<CloseFn>(close),
      }),
  )
  .extend(
    "createDataSource",
    () =>
      (close: CloseFn = async () => Promise.resolve()) => ({
        close: vi.fn<CloseFn>(close),
      }),
  )
  .extend(
    "createMainRunnerRef",
    ({ createWorker, createDataSource }) =>
      ({
        flowWorkers = [],
        sandboxedWorkers = [],
        pluginDataSources = [],
      }: {
        flowWorkers?: ReturnType<typeof createWorker>[];
        sandboxedWorkers?: ReturnType<typeof createWorker>[];
        pluginDataSources?: ReturnType<typeof createDataSource>[];
      }) => {
        const dataSources = new DataSourceMap();

        for (const [index, dataSource] of pluginDataSources.entries()) {
          dataSources.set(
            class PluginDataSource {
              public readonly index = index;
            } as never,
            dataSource as never,
          );
          expect(dataSources.size).toBe(index + 1);
        }

        return {
          getSnapshot: () => ({
            context: {
              flowWorkers: Object.fromEntries(
                flowWorkers.map((worker) => [worker.name, { worker }]),
              ),
              sandboxedWorkers: Object.fromEntries(
                sandboxedWorkers.map((worker) => [worker.name, { worker }]),
              ),
              plugins: new Map([[Symbol("plugin"), { dataSources }]]),
            },
          }),
        } as unknown as NonNullable<ShutdownInput["mainRunnerRef"]>;
      },
  );

it("does nothing when the main runner has not started", async ({
  spyOnKeyvDisconnect,
}) => {
  const disconnectSpy = spyOnKeyvDisconnect().mockResolvedValue(undefined);

  await runShutdown(undefined);

  expect(disconnectSpy).not.toHaveBeenCalled();
});

it("closes flow and sandboxed workers gracefully, plugin data sources forcefully, then disconnects Redis", async ({
  spyOnKeyvDisconnect,
  createWorker,
  createDataSource,
  createMainRunnerRef,
}) => {
  const events: string[] = [];
  const record = (event: string) => async () => {
    events.push(event);

    return Promise.resolve();
  };

  const flowWorker = createWorker("flow", record("flow closed"));
  const sandboxedWorker = createWorker("sandboxed", record("sandboxed closed"));
  const pluginDataSource = createDataSource(record("plugin closed"));

  spyOnKeyvDisconnect().mockImplementation(record("redis disconnected"));

  await runShutdown(
    createMainRunnerRef({
      flowWorkers: [flowWorker],
      sandboxedWorkers: [sandboxedWorker],
      pluginDataSources: [pluginDataSource],
    }),
  );

  expect(flowWorker.close).toHaveBeenCalledExactlyOnceWith();
  expect(sandboxedWorker.close).toHaveBeenCalledExactlyOnceWith();
  expect(pluginDataSource.close).toHaveBeenCalledExactlyOnceWith(true);
  expect(events).toStrictEqual([
    "flow closed",
    "sandboxed closed",
    "plugin closed",
    "redis disconnected",
  ]);
});

it("force-closes a worker that fails to close gracefully", async ({
  spyOnKeyvDisconnect,
  createWorker,
  createMainRunnerRef,
}) => {
  spyOnKeyvDisconnect().mockResolvedValue(undefined);

  const worker = createWorker("flow", async (force) =>
    force
      ? Promise.resolve()
      : Promise.reject(new Error("Graceful close failed")),
  );

  await runShutdown(createMainRunnerRef({ flowWorkers: [worker] }));

  expect(worker.close.mock.calls).toStrictEqual([[], [true]]);
});

it("force-closes a worker that does not close within 10 seconds", async ({
  spyOnKeyvDisconnect,
  createWorker,
  createMainRunnerRef,
}) => {
  expect.hasAssertions();

  spyOnKeyvDisconnect().mockResolvedValue(undefined);

  const timeout = new AbortController();
  const timeoutSpy = vi
    .spyOn(AbortSignal, "timeout")
    .mockReturnValue(timeout.signal);

  // A graceful close never settles, as if the worker is stuck processing a job
  const stuck = Promise.withResolvers<undefined>();
  const worker = createWorker("flow", async (force) =>
    force ? Promise.resolve() : stuck.promise,
  );

  const shutdownPromise = runShutdown(
    createMainRunnerRef({ flowWorkers: [worker] }),
  );

  await vi.waitFor(() => {
    expect(worker.close).toHaveBeenCalledExactlyOnceWith();
  });

  timeout.abort();

  await shutdownPromise;

  expect(timeoutSpy).toHaveBeenCalledWith(10_000);
  expect(worker.close.mock.calls).toStrictEqual([[], [true]]);
});

it("completes the shutdown when workers, data sources or Redis fail to close", async ({
  spyOnKeyvDisconnect,
  createWorker,
  createDataSource,
  createMainRunnerRef,
}) => {
  const disconnectSpy = spyOnKeyvDisconnect().mockRejectedValue(
    new Error("Redis is unavailable"),
  );

  const failingClose = async () => Promise.reject(new Error("Close failed"));

  const flowWorker = createWorker("flow", failingClose);
  const pluginDataSource = createDataSource(failingClose);

  await expect(
    runShutdown(
      createMainRunnerRef({
        flowWorkers: [flowWorker],
        pluginDataSources: [pluginDataSource],
      }),
    ),
  ).resolves.toBeUndefined();

  expect(flowWorker.close.mock.calls).toStrictEqual([[], [true]]);
  expect(pluginDataSource.close).toHaveBeenCalledExactlyOnceWith(true);
  expect(disconnectSpy).toHaveBeenCalledOnce();
});
