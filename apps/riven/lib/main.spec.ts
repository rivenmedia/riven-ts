import { randomUUID } from "node:crypto";
import { setTimeout } from "node:timers/promises";
import { expect, vi } from "vitest";
import {
  createActor,
  createEmptyActor,
  fromCallback,
  fromPromise,
} from "xstate";

import { it as baseIt } from "./__tests__/test-context.ts";
import { main } from "./main.ts";
import * as rivenMachineModule from "./state-machines/program/index.ts";
import { rivenMachine } from "./state-machines/program/index.ts";
import { SessionID } from "./utilities/logger/session-id.ts";

import type { BootstrapMachineOutput } from "./state-machines/bootstrap/index.ts";
import type { AnyActor, SnapshotFrom } from "xstate";

const it = baseIt
  .extend("mockRivenMachine", () =>
    rivenMachine.provide({
      actors: {
        bootstrapMachine: fromPromise<BootstrapMachineOutput>(async () => {
          await setTimeout(50);

          return Promise.resolve({
            pluginQueues: new Map(),
            plugins: new Map(),
            pluginWorkers: new Map(),
            publishableEvents: new Set(),
            server: {} as never,
            vfs: {} as never,
          });
        }) as never,
        mainRunnerMachine: fromCallback(() => undefined) as never,
        shutdown: createEmptyActor() as never,
        stopGqlServer: createEmptyActor() as never,
        unmountVfs: createEmptyActor() as never,
      },
    }),
  )
  .extend("createRivenMachineActor", ({ mockRivenMachine }, { onCleanup }) => {
    const actors = new Set<AnyActor>();

    onCleanup(() => {
      for (const actor of actors) {
        actor.stop();
      }
    });

    return (machineLogic: typeof mockRivenMachine = mockRivenMachine) => {
      const actor = createActor(machineLogic, {
        input: {
          applicationContext: {} as never,
          sessionId: SessionID.parse(randomUUID()),
          mockScenario: undefined,
        },
      });

      vi.spyOn(actor, "send");
      vi.spyOn(rivenMachineModule, "createRivenMachine").mockReturnValue(actor);

      actors.add(actor);

      return actor;
    };
  });

it.beforeEach(() => {
  // oxlint-disable-next-line vitest/prefer-mock-return-shorthand - we need to genuinely overwrite the implementation here to avoid actually calling the real process.exit()
  vi.spyOn(process, "exit").mockImplementation(() => undefined as never);
});

it.afterEach(() => {
  process.exitCode = undefined;
});

const shutdownPermutations = [
  ["SIGTERM", "Running"],
  ["SIGINT", "Running"],
  ["SIGINT", "Bootstrapping"],
  ["SIGTERM", "Bootstrapping"],
] satisfies [NodeJS.Signals, SnapshotFrom<typeof rivenMachine>["value"]][];

it.for(shutdownPermutations)(
  'sends "riven.core.shutdown" event when receiving a "%s" signal whilst in the "%s" state',
  async ([signal, state], { createRivenMachineActor }) => {
    const rivenMachineActor = createRivenMachineActor();

    void main();

    await vi.waitFor(() => {
      expect(rivenMachineActor.getSnapshot().value).toBe(state);
    });

    process.emit(signal);

    expect(rivenMachineActor).toHaveReceivedEvent({
      type: "riven.core.shutdown",
    });
  },
);

it("exits with code 1 on uncaught exceptions", async ({
  createRivenMachineActor,
}) => {
  vi.useFakeTimers();

  // oxlint-disable-next-line typescript/unbound-method
  const exitSpy = vi.mocked(process.exit);
  const onSpy = vi.spyOn(process, "on");

  const rivenMachineActor = createRivenMachineActor();

  void main();

  await vi.waitFor(() => {
    expect(rivenMachineActor.getSnapshot().value).toBe("Running");
  });

  // Invoke the handler main() registered directly, rather than emitting
  // "uncaughtException" on `process` itself: Wallaby & Vitest also listen for that event
  // to detect genuinely uncaught errors, so emitting it manually gets misattributed as a
  // real crash instead of exercising the handler under test.
  const [, uncaughtExceptionHandler] = onSpy.mock.calls.find(
    ([event]) => event === "uncaughtException",
  ) as [string, NodeJS.UncaughtExceptionListener];

  uncaughtExceptionHandler(
    new Error("Test uncaught exception"),
    "uncaughtException",
  );

  expect(rivenMachineActor).toHaveReceivedEvent({
    type: "riven.core.shutdown",
  });

  await vi.waitFor(() => {
    expect(rivenMachineActor.getSnapshot().value).toBe("Exited");
  });

  await vi.waitFor(() => {
    expect(process.exitCode).toBe(1);
    expect(exitSpy).toHaveBeenCalledOnce();
  });
});

it("does not force quit the process if shutdown succeeds within the configured timeout", async ({
  createRivenMachineActor,
}) => {
  // oxlint-disable-next-line typescript/unbound-method
  const exitSpy = vi.mocked(process.exit);

  const rivenMachineActor = createRivenMachineActor();

  void main();

  await vi.waitFor(() => {
    expect(rivenMachineActor.getSnapshot().value).toBe("Running");
  });

  rivenMachineActor.send({ type: "riven.core.shutdown" });

  await vi.waitFor(() => {
    expect(rivenMachineActor.getSnapshot().value).toBe("Exited");
  });

  await vi.waitFor(() => {
    expect(process.exitCode).toBe(0);
    expect(exitSpy).toHaveBeenCalledWith();
  });
});

// Riven removes every process listener it registered once shutdown completes.
// This matters most under a test runner: each worker that runs this file would
// otherwise leave a listener behind, accumulating until the process hangs.
it("removes the process listeners it registered once shutdown completes", async ({
  createRivenMachineActor,
}) => {
  const signals = [
    "uncaughtException",
    "unhandledRejection",
    "SIGINT",
    "SIGTERM",
  ] as const;

  const countListeners = (): Record<(typeof signals)[number], number> => ({
    uncaughtException: process.listenerCount("uncaughtException"),
    unhandledRejection: process.listenerCount("unhandledRejection"),
    SIGINT: process.listenerCount("SIGINT"),
    SIGTERM: process.listenerCount("SIGTERM"),
  });

  const listenersBeforeStart = countListeners();
  const rivenMachineActor = createRivenMachineActor();
  const rivenPromise = main();

  await vi.waitFor(() => {
    expect(rivenMachineActor.getSnapshot().value).toBe("Running");
  });

  for (const signal of signals) {
    expect(process.listenerCount(signal)).toBe(
      listenersBeforeStart[signal] + 1,
    );
  }

  rivenMachineActor.send({ type: "riven.core.shutdown" });

  await rivenPromise;

  expect(countListeners()).toStrictEqual(listenersBeforeStart);
});

// Unhandled rejections are logged but deliberately do not terminate Riven,
// unlike uncaught exceptions.
it("logs unhandled rejections without shutting down", async ({
  createRivenMachineActor,
}) => {
  const onSpy = vi.spyOn(process, "on");
  const rivenMachineActor = createRivenMachineActor();

  void main();

  await vi.waitFor(() => {
    expect(rivenMachineActor.getSnapshot().value).toBe("Running");
  });

  const [, unhandledRejectionHandler] = onSpy.mock.calls.find(
    ([event]) => event === "unhandledRejection",
  ) as [string, (reason: unknown) => void];

  unhandledRejectionHandler(new Error("Test unhandled rejection"));

  expect(rivenMachineActor).not.toHaveReceivedEvent({
    type: "riven.core.shutdown",
  });

  expect(rivenMachineActor.getSnapshot().value).toBe("Running");
});
