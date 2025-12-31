import type { PluginToProgramEvent, ProgramToPluginEvent } from "./events.ts";
import type { RequestedItem } from "../schemas/index.ts";
import type { DataSourceMap } from "../types/utilities.ts";
import type { ApolloClient } from "@apollo/client";
import {
  fromCallback,
  type ActorRef,
  type CallbackLogicFunction,
  type MachineContext,
  type Snapshot,
} from "xstate";

export type ParentRef = ActorRef<
  Snapshot<unknown>,
  PluginToProgramEvent,
  ProgramToPluginEvent
>;

export interface PluginRunnerContext extends MachineContext {
  pluginSymbol: symbol;
}

export interface PluginRunnerInput {
  client: ApolloClient;
  pluginSymbol: symbol;
  dataSources: DataSourceMap;
}

interface PluginRunnerHelpers extends Record<
  string,
  // eslint-disable-next-line @typescript-eslint/no-invalid-void-type
  (this: void, ...args: never[]) => void
> {
  publishEvent: <T extends PluginToProgramEvent["type"]>(
    // eslint-disable-next-line @typescript-eslint/no-invalid-void-type
    this: void,
    event: T,
    params: Omit<Extract<PluginToProgramEvent, { type: T }>, "type" | "plugin">,
  ) => void;
}

type PluginRunner = (params: {
  helpers: PluginRunnerHelpers;
  receive: Parameters<
    CallbackLogicFunction<ProgramToPluginEvent>
  >[0]["receive"];
  input: PluginRunnerInput;
  // eslint-disable-next-line @typescript-eslint/no-invalid-void-type
}) => Promise<void | (() => void)>;

export const createPluginRunner = (callback: PluginRunner) =>
  fromCallback<ProgramToPluginEvent, PluginRunnerInput, PluginToProgramEvent>(
    ({ input, sendBack, receive }) => {
      const providePluginSymbol = (
        event: Omit<PluginToProgramEvent, "plugin">,
      ): PluginToProgramEvent => ({
        ...event,
        plugin: input.pluginSymbol,
      });

      const helpers = {
        publishEvent(event, params) {
          sendBack(
            providePluginSymbol({
              type: event,
              ...params,
            }),
          );
        },
        sendMediaRequestedEvent(item: RequestedItem) {
          sendBack(
            providePluginSymbol({
              type: "media:requested",
              item,
            }),
          );
        },
      } satisfies PluginRunnerHelpers;

      return callback({
        input,
        helpers,
        receive,
      }) as unknown as Awaited<ReturnType<PluginRunner>>;
    },
  );

export type PluginRunnerLogic = ReturnType<typeof createPluginRunner>;
