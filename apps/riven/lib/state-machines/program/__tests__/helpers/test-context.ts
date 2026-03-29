/* eslint-disable no-empty-pattern */
import { DataSourceMap } from "@repo/util-plugin-sdk";

import { vi } from "vitest";
import { createActor, fromPromise } from "xstate";

import { it as baseIt } from "../../../../__tests__/test-context.ts";
import {
  type BootstrapMachineOutput,
  bootstrapMachine,
} from "../../../bootstrap/index.ts";
import { rivenMachine } from "../../index.ts";

import type { ValidPlugin } from "../../../../types/plugins.ts";

export const it = baseIt
  .extend("input", () => ({
    sessionId: crypto.randomUUID(),
  }))
  .extend("machine", () => rivenMachine)
  .extend(
    "bootstrapMachineOutput",
    async ({}): Promise<BootstrapMachineOutput> => {
      const testPlugin = await import("@repo/plugin-test");

      return {
        server: {} as never,
        plugins: new Map<symbol, ValidPlugin>([
          [
            testPlugin.default.name,
            {
              config: testPlugin.default,
              dataSources: new DataSourceMap(),
              status: "valid",
            },
          ],
        ]),
        pluginQueues: new Map(),
        pluginWorkers: new Map(),
        publishableEvents: new Set(),
        vfs: {} as never,
      };
    },
  )
  .extend("bootstrapMachineActorLogic", bootstrapMachine)
  .extend("stopGqlServerActorLogic", fromPromise(vi.fn()))
  .extend("actor", ({ machine, input }, { onCleanup }) => {
    const actor = createActor(machine, { input });

    onCleanup(() => {
      actor.stop();
    });

    return actor;
  });
