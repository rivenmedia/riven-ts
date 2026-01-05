import { type EventObject, fromCallback } from "xstate";

import type {
  DataSourceMap,
  EventHandler,
  RivenPlugin,
} from "@repo/util-plugin-sdk";
import type { PluginToProgramEvent } from "@repo/util-plugin-sdk/plugin-to-program-events";
import type { ProgramToPluginEvent } from "@repo/util-plugin-sdk/program-to-plugin-events";

export interface PluginActorInput {
  pluginSymbol: symbol;
  dataSources: DataSourceMap;
  hooks: RivenPlugin["hooks"];
}

const providePluginSymbol = <T extends EventObject>(
  pluginSymbol: symbol,
  event: Omit<T, "plugin">,
) => ({
  ...event,
  plugin: pluginSymbol,
});

const publishEvent = <
  Type extends PluginToProgramEvent["type"],
  Event extends Extract<PluginToProgramEvent, { type: Type }>,
>(
  pluginSymbol: symbol,
  sendBack: (event: EventObject) => void,
  event: Omit<Event, "plugin"> & { type: Type },
) => {
  sendBack(providePluginSymbol(pluginSymbol, event));
};

export const pluginActor = fromCallback<ProgramToPluginEvent, PluginActorInput>(
  ({ sendBack, input, receive }) => {
    receive((event) => {
      const hook = input.hooks[event.type] as EventHandler | undefined;

      if (!hook) {
        return;
      }

      void hook({
        dataSources: input.dataSources,
        event,
        publishEvent: publishEvent.bind(null, input.pluginSymbol, sendBack),
      });
    });

    return () => {
      console.log(
        "Plugin actor shutdown for",
        String(input.pluginSymbol.description),
      );
    };
  },
);
