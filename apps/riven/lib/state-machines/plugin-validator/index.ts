import { logger } from "@repo/core-util-logger";
import {
  type DataSourceMap,
  type PluginRunnerInput,
  type PluginToProgramEvent,
  type ProgramToPluginEvent,
  createPluginValidator,
} from "@repo/util-plugin-sdk";

import type { ApolloClient } from "@apollo/client";
import {
  type ActorRef,
  type MachineContext,
  type Snapshot,
  assign,
  setup,
} from "xstate";

import { processRequestedItem } from "../bootstrap/actors/process-requested-item.actor.ts";

export interface PluginMachineContext extends MachineContext {
  pluginSymbol: symbol;
  pluginPrettyName: string;
  client: ApolloClient;
  dataSources: DataSourceMap;
  validationFailures: number;
  isValidated: boolean;
  parentRef: ActorRef<Snapshot<unknown>, ProgramToPluginEvent>;
}

export interface PluginMachineInput extends PluginRunnerInput {
  parentRef: ActorRef<Snapshot<unknown>, ProgramToPluginEvent>;
}

export type PluginMachineEvent =
  | ProgramToPluginEvent
  | PluginToProgramEvent
  | { type: "riven.validate-plugin" };

export const pluginMachine = setup({
  types: {
    context: {} as PluginMachineContext,
    events: {} as PluginMachineEvent,
    input: {} as PluginMachineInput,
    children: {} as {
      processRequestedItem: "processRequestedItem";
      validatePlugin: "validatePlugin";
    },
    output: {} as {
      plugin: symbol;
    },
  },
  actions: {
    resetValidationFailures: assign({
      validationFailures: 0,
    }),
    incrementValidationFailures: assign(({ context }) => ({
      validationFailures: context.validationFailures + 1,
    })),
  },
  actors: {
    processRequestedItem,
    validatePlugin: createPluginValidator(() => true),
  },
  guards: {
    isPluginValid: (_, isValid: boolean) => isValid,
    hasReachedMaxValidationFailures: ({ context }) =>
      context.validationFailures >= 3,
  },
}).createMachine({
  context: ({
    input: { client, pluginSymbol: pluginSymbol, dataSources, parentRef },
  }) => ({
    client,
    pluginSymbol,
    pluginPrettyName: pluginSymbol.description ?? pluginSymbol.toString(),
    dataSources,
    validationFailures: 0,
    isValidated: false,
    parentRef,
  }),
  id: "Plugin validation runner",
  initial: "Idle",
  output: ({ context }) => ({
    plugin: context.pluginSymbol,
  }),
  states: {
    Idle: {
      on: {
        "riven.validate-plugin": "Validating",
      },
    },
    Validating: {
      entry: ({ context }) => {
        logger.info(`Validating ${context.pluginPrettyName}`);
      },
      invoke: {
        id: "validatePlugin",
        src: "validatePlugin",
        input: ({ context }) => ({
          client: context.client,
          pluginSymbol: context.pluginSymbol,
          dataSources: context.dataSources,
        }),
        onDone: [
          {
            target: "Validated",
            guard: {
              type: "isPluginValid",
              params: ({ event }) => event.output,
            },
          },
          {
            target: "Validation error",
          },
        ],
        onError: "Validation error",
      },
    },
    Validated: {
      type: "final",
    },
    "Validation error": {
      entry: [
        {
          type: "incrementValidationFailures",
        },
        ({ context }) => {
          logger.error(`Validation failed for ${context.pluginPrettyName}`);
        },
      ],
      always: {
        guard: "hasReachedMaxValidationFailures",
        target: "Errored",
      },
      after: {
        5000: "Validating",
      },
    },
    Errored: {
      type: "final",
      entry: ({ context }) => {
        logger.error(
          `${context.pluginPrettyName} has errored and will not be started`,
        );
      },
    },
  },
});
