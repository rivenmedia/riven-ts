import { expect, it, vi } from "vitest";
import { createActor, waitFor } from "xstate";

import { keyvInstance } from "../../../utilities/redis-cache.ts";
import { shutdown } from "./shutdown.actor.ts";

vi.mock("../../../utilities/redis-cache.ts", () => ({
  keyvInstance: {
    disconnect: vi.fn(),
  },
}));

function createMockWorkerAndQueue() {
  return {
    worker: {
      cancelAllJobs: vi.fn(),
      close: vi.fn().mockResolvedValue(undefined),
    },
    queue: {
      pause: vi.fn().mockResolvedValue(undefined),
      close: vi.fn().mockResolvedValue(undefined),
    },
  };
}

it("performs full shutdown sequence", async () => {
  const flowWorkerEntry = createMockWorkerAndQueue();
  const sandboxedWorkerEntry = createMockWorkerAndQueue();

  const pluginQueue = {
    pause: vi.fn().mockResolvedValue(undefined),
    close: vi.fn().mockResolvedValue(undefined),
  };
  const pluginQueueMap = new Map([
    [{ description: "@repo/plugin-test" }, new Map([["event", pluginQueue]])],
  ]);

  const pluginWorker = {
    cancelAllJobs: vi.fn(),
    close: vi.fn().mockResolvedValue(undefined),
  };
  const pluginWorkerMap = new Map([
    [{ description: "@repo/plugin-test" }, new Map([["event", pluginWorker]])],
  ]);

  const dsQueue = {
    pause: vi.fn().mockResolvedValue(undefined),
    close: vi.fn().mockResolvedValue(undefined),
  };
  const dsWorker = {
    cancelAllJobs: vi.fn(),
    close: vi.fn().mockResolvedValue(undefined),
  };
  const plugins = new Map([
    [
      Symbol.for("@repo/plugin-test"),
      {
        dataSources: new Map([["ds1", { queue: dsQueue, worker: dsWorker }]]),
      },
    ],
  ]);

  const mainRunnerRef = {
    getSnapshot: () => ({
      context: {
        flowWorkers: { "flow-1": flowWorkerEntry },
        sandboxedWorkers: { "sandboxed-1": sandboxedWorkerEntry },
        pluginWorkers: pluginWorkerMap,
        pluginQueues: pluginQueueMap,
        plugins,
      },
    }),
  };

  vi.mocked(keyvInstance.disconnect).mockResolvedValue(undefined);

  const actor = createActor(shutdown, {
    input: { mainRunnerRef } as never,
  });

  actor.start();
  await waitFor(actor, (s) => s.status === "done");

  expect(flowWorkerEntry.queue.pause).toHaveBeenCalled();
  expect(sandboxedWorkerEntry.queue.pause).toHaveBeenCalled();
  expect(pluginQueue.pause).toHaveBeenCalled();
  expect(dsQueue.pause).toHaveBeenCalled();

  expect(flowWorkerEntry.worker.cancelAllJobs).toHaveBeenCalled();
  expect(sandboxedWorkerEntry.worker.cancelAllJobs).toHaveBeenCalled();
  expect(pluginWorker.cancelAllJobs).toHaveBeenCalled();
  expect(dsWorker.cancelAllJobs).toHaveBeenCalled();

  expect(flowWorkerEntry.worker.close).toHaveBeenCalled();
  expect(dsWorker.close).toHaveBeenCalledWith(true);
  expect(keyvInstance.disconnect).toHaveBeenCalled();
});

it("returns early if mainRunnerRef is undefined", async () => {
  const disconnectMock = vi.fn();
  vi.mocked(keyvInstance.disconnect).mockImplementation(disconnectMock);

  const actor = createActor(shutdown, {
    input: { mainRunnerRef: undefined },
  });

  actor.start();
  await waitFor(actor, (s) => s.status === "done");

  expect(disconnectMock).not.toHaveBeenCalled();
});

it("logs error if keyv disconnect fails", async () => {
  const mainRunnerRef = {
    getSnapshot: () => ({
      context: {
        flowWorkers: {},
        sandboxedWorkers: {},
        pluginWorkers: new Map(),
        pluginQueues: new Map(),
        plugins: new Map(),
      },
    }),
  };

  vi.mocked(keyvInstance.disconnect).mockRejectedValue(
    new Error("Redis error"),
  );

  const actor = createActor(shutdown, {
    input: { mainRunnerRef } as never,
  });

  actor.start();
  await waitFor(actor, (s) => s.status === "done");

  // Should complete without error (error is caught internally)
  expect(actor.getSnapshot().status).toBe("done");
});
