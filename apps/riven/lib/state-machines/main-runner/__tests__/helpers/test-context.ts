/* eslint-disable no-empty-pattern */
import { it as baseIt } from "@repo/core-util-vitest-test-context";
import testPlugin from "@repo/plugin-test";
import { DataSourceMap } from "@repo/util-plugin-sdk";

import { type Actor, createActor } from "xstate";

import {
  type MainRunnerMachineInput,
  mainRunnerMachine,
} from "../../../main-runner/index.ts";
import type { PendingRunnerInvocationPlugin } from "../../../plugin-registrar/actors/collect-plugins-for-registration.actor.ts";

export const it = baseIt.extend<{
  actor: Actor<typeof mainRunnerMachine>;
  input: MainRunnerMachineInput;
  machine: typeof mainRunnerMachine;
}>({
  machine: ({}, use) =>
    use(
      mainRunnerMachine.provide({
        actors: {},
      }),
    ),
  input: {
    plugins: new Map<symbol, PendingRunnerInvocationPlugin>([
      [
        testPlugin.name,
        {
          config: testPlugin,
          dataSources: new DataSourceMap(),
          status: "pending-runner-invocation",
        },
      ],
    ]),
  },
  actor: async ({ input, machine }, use) => {
    const actor = createActor(machine, { input });

    await use(actor);

    actor.stop();
  },
});
