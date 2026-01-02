import { it as baseIt } from "@repo/core-util-vitest-test-context";
import { DataSourceMap } from "@repo/util-plugin-sdk";

import { type Actor, createActor } from "xstate";

import {
  type PluginValidatorMachineInput,
  pluginValidatorMachine,
} from "../../index.ts";

export const it = baseIt.extend<{
  input: PluginValidatorMachineInput;
  actor: Actor<typeof pluginValidatorMachine>;
  machine: typeof pluginValidatorMachine;
}>({
  input: {
    client: {} as never,
    dataSources: new DataSourceMap(),
    pluginSymbol: Symbol("test-plugin"),
  },
  machine: pluginValidatorMachine,
  actor: async ({ machine, input }, use) => {
    const actor = createActor(machine, { input });

    actor.start();

    await use(actor);

    actor.stop();
  },
});
