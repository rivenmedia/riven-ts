import { fromCallback } from "xstate";

import type { RegisteredPlugin } from "../../bootstrap/actors/register-plugins.actor.ts";
import type { PluginValidatorMachineEvent } from "../index.ts";

export interface ValidatePluginInput {
  plugin: RegisteredPlugin;
}

export const validatePlugin = fromCallback<
  PluginValidatorMachineEvent,
  ValidatePluginInput
>(({ input: { plugin }, sendBack }) => {
  async function doValidate() {
    const maxAttempts = 3;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const isValid = await plugin.config.validator();

        if (isValid) {
          return {
            ...plugin,
            status: "pending-runner-invocation",
          };
        }
      } catch (error) {
        if (attempt >= maxAttempts) {
          throw error;
        }

        await new Promise((resolve) => setTimeout(resolve, attempt * 1000));
      }
    }

    return {
      ...plugin,
      status: "invalid",
    };
  }

  void doValidate().then((validatedPlugin) => {
    sendBack({
      type:
        validatedPlugin.status === "pending-runner-invocation"
          ? "riven.plugin-valid"
          : "riven.plugin-invalid",
      plugin: validatedPlugin,
    });
  });

  return () => {
    /* empty */
  };
});
