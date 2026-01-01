import { pluginMachine, type PluginMachineInput } from "../../index.ts";
import { it as baseIt } from "@repo/core-util-vitest-test-context";
import { DataSourceMap } from "@repo/util-plugin-sdk";
import { createActor, type Actor } from "xstate";

export const it = baseIt.extend<{
  defaultInput: PluginMachineInput;
  actor: Actor<typeof pluginMachine>;
  machine: typeof pluginMachine;
}>({
  defaultInput: {
    client: {} as never,
    dataSources: new DataSourceMap(),
    pluginSymbol: Symbol("test-plugin"),
  },
  machine: pluginMachine,
  actor: async ({ defaultInput }, use) => {
    const actor = createActor(pluginMachine, { input: defaultInput });

    actor.start();

    await use(actor);

    actor.stop();
  },
});
