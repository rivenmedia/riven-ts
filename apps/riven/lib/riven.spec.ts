import { randomUUID } from "node:crypto";
import { setTimeout } from "node:timers/promises";
import { expect, vi } from "vitest";
import {
  type SnapshotFrom,
  createActor,
  createEmptyActor,
  fromCallback,
  fromPromise,
} from "xstate";

import { it as baseIt } from "./__tests__/test-context.ts";
import { riven } from "./riven.ts";
import { type BootstrapMachineOutput } from "./state-machines/bootstrap/index.ts";
import * as rivenMachineModule from "./state-machines/program/index.ts";
import { rivenMachine } from "./state-machines/program/index.ts";
import { SessionID } from "./utilities/logger/log-context.ts";

const it = baseIt.extend("rivenMachineActor", () => {
  const mockRivenMachine = rivenMachine.provide({
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
      mainRunnerMachine: fromCallback(() => {
        /* empty */
      }) as never,
      shutdown: createEmptyActor() as never,
      stopGqlServer: createEmptyActor() as never,
      unmountVfs: createEmptyActor() as never,
    },
  });

  const actor = createActor(mockRivenMachine, {
    input: {
      sessionId: SessionID.parse(randomUUID()),
    },
  });

  vi.spyOn(actor, "send");
  vi.spyOn(rivenMachineModule, "createRivenMachine").mockReturnValue(actor);

  return actor;
});

const shutdownPermutations = [
  ["SIGTERM", "Running"],
  ["SIGINT", "Running"],
  ["SIGINT", "Bootstrapping"],
  ["SIGTERM", "Bootstrapping"],
] satisfies [NodeJS.Signals, SnapshotFrom<typeof rivenMachine>["value"]][];

it.for(shutdownPermutations)(
  'sends "riven.core.shutdown" event when receiving a "%s" signal whilst in the "%s" state',
  async ([signal, state], { rivenMachineActor }) => {
    void riven();

    await vi.waitFor(() => {
      expect(rivenMachineActor.getSnapshot().value).toBe(state);
    });

    process.emit(signal);

    expect(rivenMachineActor).toHaveReceivedEvent({
      type: "riven.core.shutdown",
    });
  },
);
