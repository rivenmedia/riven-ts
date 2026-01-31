import { it as baseIt } from "@repo/core-util-vitest-test-context";
import testPlugin from "@repo/plugin-test";
import { DataSourceMap } from "@repo/util-plugin-sdk";

import { vi } from "vitest";
import { type Actor, createActor } from "xstate";

import {
  type MainRunnerMachineInput,
  mainRunnerMachine,
} from "../../../main-runner/index.ts";

import type { ValidPlugin } from "../../../../types/plugins.ts";

export const it = baseIt.extend<{
  actor: Actor<typeof mainRunnerMachine>;
  input: MainRunnerMachineInput;
  machine: typeof mainRunnerMachine;
}>({
  machine: mainRunnerMachine,
  input: {
    plugins: new Map<symbol, ValidPlugin>([
      [
        testPlugin.name,
        {
          config: testPlugin,
          dataSources: new DataSourceMap(),
          status: "valid",
        },
      ],
    ]),
    publishableEvents: new Set(),
    pluginQueues: new Map(),
    pluginWorkers: new Map(),
  },
  actor: async ({ input, machine }, use) => {
    const actor = createActor(machine, { id: "Main runner", input });

    vi.spyOn(actor, "send");

    await use(actor);

    actor.stop();
  },
});
