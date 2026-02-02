import { logger } from "@repo/core-util-logger";

import { setTimeout } from "node:timers/promises";
import { fromCallback } from "xstate";

import type { RegisteredPlugin } from "../../../types/plugins.ts";
import type { PluginRegistrarMachineEvent } from "../index.ts";
import type { PluginSettings } from "@repo/util-plugin-sdk/utilities/plugin-settings";

export interface ValidatePluginInput {
  plugin: RegisteredPlugin;
  settings: PluginSettings;
}

export const validatePlugin = fromCallback<
  PluginRegistrarMachineEvent,
  ValidatePluginInput
>(({ input: { plugin, settings }, sendBack }) => {
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

  function parseSettings() {
    const { settingsSchema } = plugin.config;

    if (!settingsSchema) {
      return;
    }

    try {
      settings.set(settingsSchema, settingsSchema.parse(process.env));
    } catch (error) {
      logger.error(
        `Failed to parse settings for plugin "${String(
          plugin.config.name,
        )}": ${(error as Error).message}`,
      );

      sendInvalidPluginEvent(error);
    }
  }

  async function validate() {
    const maxAttempts = 3;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const isValid = await plugin.config.validator({ settings });

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

        await setTimeout(attempt * 1000);
      }
    }
  }

  // Parse the settings from environment variables and store them in the Settings instance
  parseSettings();

  // Run the plugin validator
  void validate();

  return () => {
    /* empty */
  };
});
