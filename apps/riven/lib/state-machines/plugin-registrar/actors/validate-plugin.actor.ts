import { NonRetriableValidationError } from "@repo/util-plugin-sdk/errors/non-retriable-validation-error";

import { setTimeout } from "node:timers/promises";
import { fromCallback } from "xstate";

import { logger } from "../../../utilities/logger/logger.ts";

import type { RegisteredPlugin } from "../../../types/plugins.ts";
import type { PluginRegistrarMachineEvent } from "../index.ts";
import type { DataSourceMap } from "@repo/util-plugin-sdk";
import type { PluginSettings } from "@repo/util-plugin-sdk/utilities/plugin-settings";

export interface ValidatePluginInput {
  plugin: RegisteredPlugin;
  settings: PluginSettings;
  dataSources: DataSourceMap;
}

export const validatePlugin = fromCallback<
  PluginRegistrarMachineEvent,
  ValidatePluginInput
>(({ input: { plugin, settings, dataSources }, sendBack }) => {
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
        const pluginName =
          plugin.config.name.description ?? String(plugin.config.name);
        const start = performance.now();

        const isValid = await plugin.config.validator({
          settings,
          dataSources,
        });

        const duration = performance.now() - start;
        logger.debug(
          `Plugin "${pluginName}" validation attempt ${attempt.toString()} took ${duration.toFixed(2)}ms (result: ${isValid.toString()})`,
        );

        if (!isValid) {
          throw new Error("Plugin validation returned false");
        }

        sendValidPluginEvent();

        return;
      } catch (error) {
        if (
          error instanceof NonRetriableValidationError ||
          attempt >= maxAttempts
        ) {
          const pluginName =
            plugin.config.name.description ?? String(plugin.config.name);

          if (error instanceof NonRetriableValidationError) {
            logger.error(
              `Plugin "${pluginName}" validation failed (non-retriable): ${error.message}`,
            );
          } else {
            logger.error(
              `Plugin "${pluginName}" validation failed after ${attempt.toString()} attempts`,
              { err: error },
            );
          }

          sendInvalidPluginEvent(error);

          return;
        }

        await setTimeout(attempt * 1000);
      }
    }
  }

  // Run the plugin validator
  void validate();

  return () => {
    /* empty */
  };
});
