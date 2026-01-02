import { logger } from "@repo/core-util-logger";

import {
  type AnyActorRef,
  type MachineContext,
  assign,
  enqueueActions,
  setup,
} from "xstate";

import type {
  InvalidPlugin,
  RegisteredPlugin,
  ValidPlugin,
} from "../bootstrap/actors/register-plugins.actor.ts";
import { validatePlugin } from "./actors/validate-plugin.actor.ts";

export interface PluginValidatorMachineContext extends MachineContext {
  validationFailures: number;
  runningValidators: Map<symbol, AnyActorRef>;
  pendingPlugins: Map<symbol, RegisteredPlugin>;
  invalidPlugins: Map<symbol, InvalidPlugin>;
  validPlugins: Map<symbol, ValidPlugin>;
}

export interface PluginValidatorMachineInput {
  plugins: Map<symbol, RegisteredPlugin>;
}

export interface PluginValidatorMachineOutput {
  validPlugins: Map<symbol, ValidPlugin>;
  invalidPlugins: Map<symbol, InvalidPlugin>;
}

export type PluginValidatorMachineEvent =
  | { type: "riven.plugin-valid"; plugin: ValidPlugin }
  | { type: "riven.plugin-invalid"; plugin: InvalidPlugin };

export const pluginValidatorMachine = setup({
  types: {
    context: {} as PluginValidatorMachineContext,
    events: {} as PluginValidatorMachineEvent,
    input: {} as PluginValidatorMachineInput,
    children: {} as {
      validatePlugin: "validatePlugin";
    },
    output: {} as PluginValidatorMachineOutput,
  },
  actions: {
    resetValidationFailures: assign({
      validationFailures: 0,
    }),
    incrementValidationFailures: assign(({ context }) => ({
      validationFailures: context.validationFailures + 1,
    })),
    handleValidPlugin: assign(({ context }, validPlugin: ValidPlugin) => {
      const existingPendingItem = context.pendingPlugins.get(
        validPlugin.config.name,
      );

      if (!existingPendingItem) {
        logger.error(
          `Received valid plugin notification for unknown plugin: ${String(
            validPlugin.config.name,
          )}`,
        );

        return;
      }

      const newPendingPlugins = new Map(context.pendingPlugins);

      newPendingPlugins.delete(validPlugin.config.name);

      return {
        pendingPlugins: newPendingPlugins,
        validPlugins: context.validPlugins.set(
          validPlugin.config.name,
          validPlugin,
        ),
      };
    }),
    handleInvalidPlugin: assign(({ context }, invalidPlugin: InvalidPlugin) => {
      const existingPendingItem = context.pendingPlugins.get(
        invalidPlugin.config.name,
      );

      if (!existingPendingItem) {
        logger.error(
          `Received invalid plugin notification for unknown plugin: ${String(
            invalidPlugin.config.name,
          )}`,
        );

        return {};
      }

      const newPendingPlugins = new Map(context.pendingPlugins);

      newPendingPlugins.delete(invalidPlugin.config.name);

      return {
        pendingPlugins: newPendingPlugins,
        invalidPlugins: context.invalidPlugins.set(
          invalidPlugin.config.name,
          invalidPlugin,
        ),
      };
    }),
    spawnValidators: enqueueActions(({ context, enqueue }) => {
      enqueue.assign({
        runningValidators: ({ spawn }) => {
          const validatorRefs = new Map(context.runningValidators);

          for (const [pluginSymbol, plugin] of context.pendingPlugins) {
            const validatorRef = spawn("validatePlugin", {
              id: "validatePlugin",
              input: { plugin },
            });

            validatorRefs.set(pluginSymbol, validatorRef);
          }

          return validatorRefs;
        },
      });
    }),
  },
  actors: {
    validatePlugin,
  },
  guards: {
    allPluginsValidated: ({ context }) => context.pendingPlugins.size === 0,
    isPluginValid: (_, isValid: boolean) => isValid,
    hasReachedMaxValidationFailures: ({ context }) =>
      context.validationFailures >= 3,
  },
}).createMachine({
  context: ({ input: { plugins } }) => ({
    invalidPlugins: new Map(),
    pendingPlugins: new Map(plugins),
    validPlugins: new Map(),
    runningValidators: new Map(),
    validationFailures: 0,
  }),
  id: "Plugin validation runner",
  initial: "Validating",
  output: ({ context }) => ({
    validPlugins: context.validPlugins,
    invalidPlugins: context.invalidPlugins,
  }),
  states: {
    Validating: {
      entry: "spawnValidators",
      always: {
        guard: "allPluginsValidated",
        target: "Validated",
      },
      on: {
        "riven.plugin-valid": {
          actions: [
            {
              type: "handleValidPlugin",
              params: ({ event }) => event.plugin,
            },
          ],
        },
        "riven.plugin-invalid": {
          actions: {
            type: "handleInvalidPlugin",
            params: ({ event }) => event.plugin,
          },
        },
      },
    },
    Validated: {
      type: "final",
    },
  },
});
