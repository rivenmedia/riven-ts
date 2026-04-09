import testPlugin from "@repo/plugin-test";
import { DataSourceMap } from "@repo/util-plugin-sdk";

import { vi } from "vitest";
import { createActor, createEmptyActor, fromPromise } from "xstate";

import { it as baseIt } from "../../../../__tests__/test-context.ts";
import {
  type MainRunnerMachineInput,
  mainRunnerMachine,
} from "../../../main-runner/index.ts";

import type { ValidPlugin } from "../../../../types/plugins.ts";

export const it = baseIt

  .extend(
    "input",
    (): MainRunnerMachineInput => ({
      parentRef: createEmptyActor(),
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
    }),
  )
  .extend("machine", () =>
    mainRunnerMachine.provide({
      actors: {
        bootstrapFlowWorkers: fromPromise(() => Promise.resolve()) as never,
        bootstrapSandboxedWorkers: fromPromise(() =>
          Promise.resolve(),
        ) as never,
      },
    }),
  )
  .extend("actor", ({ input, machine }, { onCleanup }) => {
    const actor = createActor(machine, { id: "Main runner", input });

    vi.spyOn(actor, "send");

    onCleanup(() => {
      actor.stop();
    });

    return actor;
  });
