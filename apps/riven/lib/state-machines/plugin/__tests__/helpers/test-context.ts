import { it as baseIt } from "@repo/core-util-vitest-test-context";
import { DataSourceMap } from "@repo/util-plugin-sdk";

import { type Actor, createActor } from "xstate";

import { type PluginMachineInput, pluginMachine } from "../../index.ts";

export const it = baseIt.extend<{
  input: PluginMachineInput;
  actor: Actor<typeof pluginMachine>;
  machine: typeof pluginMachine;
}>({
  input: {
    client: {} as never,
    dataSources: new DataSourceMap(),
    pluginSymbol: Symbol("test-plugin"),
  },
  machine: pluginMachine,
  actor: async ({ machine, input }, use) => {
    const actor = createActor(machine, { input });

    actor.start();

    await use(actor);

    actor.stop();
  },
});
