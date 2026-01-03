import { fromCallback } from "xstate";

import type { PluginRegistrarMachineEvent } from "../index.ts";
import type { RegisteredPlugin } from "./collect-plugins-for-registration.actor.ts";

export interface ValidatePluginInput {
  plugin: RegisteredPlugin;
}

export const validatePlugin = fromCallback<
  PluginRegistrarMachineEvent,
  ValidatePluginInput
>(({ input: { plugin }, sendBack }) => {
  function sendValidPluginEvent() {
    sendBack({
      type: "riven.plugin-valid",
      plugin: {
        ...plugin,
        status: "pending-runner-invocation",
      },
    });
  }

  function sendInvalidPluginEvent(error: unknown) {
    sendBack({
      type: "riven.plugin-invalid",
      plugin: {
        ...plugin,
        status: "invalid",
        error,
      },
    });
  }

  async function validate() {
    const maxAttempts = 3;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const isValid = await plugin.config.validator();

        if (!isValid) {
          throw new Error("Plugin validation returned false");
        }

        sendValidPluginEvent();

        return;
      } catch (error) {
        if (attempt >= maxAttempts) {
          sendInvalidPluginEvent(error);

          return;
        }

        await new Promise((resolve) => setTimeout(resolve, attempt * 1000));
      }
    }
  }

  void validate();

  return () => {
    /* empty */
  };
});
