/* eslint-disable no-empty-pattern */
import { it as baseIt } from "@repo/core-util-vitest-test-context";
import { DataSourceMap } from "@repo/util-plugin-sdk";

import { vi } from "vitest";
import { type Actor, createActor, fromPromise } from "xstate";

import {
  type BootstrapMachineOutput,
  bootstrapMachine,
} from "../../../bootstrap/index.ts";
import { mainRunnerMachine } from "../../../main-runner/index.ts";
import { type RivenMachineInput, rivenMachine } from "../../index.ts";

import type { PendingRunnerInvocationPlugin } from "../../../plugin-registrar/actors/collect-plugins-for-registration.actor.ts";
import type { stopGqlServer } from "../../actors/stop-gql-server.actor.ts";

export const it = baseIt.extend<{
  actor: Actor<typeof rivenMachine>;
  input: RivenMachineInput;
  machine: typeof rivenMachine;
  bootstrapMachineOutput: BootstrapMachineOutput;
  bootstrapMachineActorLogic: typeof bootstrapMachine;
  stopGqlServerActorLogic: typeof stopGqlServer;
}>({
  bootstrapMachineActorLogic: bootstrapMachine,
  async bootstrapMachineOutput({}, use) {
    const testPlugin = await import("@repo/plugin-test");

    return use({
      server: {} as never,
      plugins: new Map<symbol, PendingRunnerInvocationPlugin>([
        [
          testPlugin.default.name,
          {
            config: testPlugin.default,
            dataSources: new DataSourceMap(),
            status: "pending-runner-invocation",
          },
        ],
      ]),
      queues: new Map(),
    });
  },
  stopGqlServerActorLogic: fromPromise(vi.fn()),
  machine: ({ bootstrapMachineActorLogic, stopGqlServerActorLogic }, use) =>
    use(
      rivenMachine.provide({
        actors: {
          bootstrapMachine: bootstrapMachineActorLogic,
          stopGqlServer: stopGqlServerActorLogic,
          mainRunnerMachine: mainRunnerMachine,
        },
      }),
    ),
  input: {
    sessionId: "00000000-0000-0000-0000-000000000000",
  },
  actor: async ({ input, machine }, use) => {
    const actor = createActor(machine, { input });

    await use(actor);

    actor.stop();
  },
});
