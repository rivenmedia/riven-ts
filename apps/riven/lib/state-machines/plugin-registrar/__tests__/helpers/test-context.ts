/* eslint-disable no-empty-pattern */
import { it as baseIt } from "@repo/core-util-vitest-test-context";
import { DataSourceMap, createPluginRunner } from "@repo/util-plugin-sdk";

import { vi } from "vitest";
import { type Actor, createActor } from "xstate";

import {
  type PluginRegistrarMachineInput,
  pluginRegistrarMachine,
} from "../../index.ts";

export const it = baseIt.extend<{
  input: PluginRegistrarMachineInput;
  actor: Actor<typeof pluginRegistrarMachine>;
  machine: typeof pluginRegistrarMachine;
}>({
  input: async ({}, use) => {
    return use({
      plugins: new Map([
        [
          Symbol.for("Plugin: Test"),
          {
            status: "registered",
            dataSources: new DataSourceMap(),
            config: {
              name: Symbol.for("Plugin: Test"),
              resolvers: [],
              runner: createPluginRunner(vi.fn()),
              validator: vi.fn(),
            },
          },
        ],
      ]),
    });
  },
  machine: pluginRegistrarMachine,
  actor: async ({ machine, input }, use) => {
    const actor = createActor(machine, { input });

    actor.start();

    await use(actor);

    actor.stop();
  },
});
