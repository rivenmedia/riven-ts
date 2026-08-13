import { Injectable, Module } from "@nestjs/common";

import type { ValidPluginMap } from "../types/plugins.ts";
import type { PluginSettings } from "@repo/util-plugin-sdk/utilities/plugin-settings";

export interface PluginRegistration {
  plugins: ValidPluginMap;
  pluginSettings: PluginSettings;
}

/**
 * Holds the plugins that passed validation during bootstrap.
 *
 * Plugins are discovered and validated at runtime by the plugin registrar state
 * machine, so they cannot be expressed as providers in a static module graph.
 * The registrar's result is handed to this service once bootstrap reaches the
 * point where plugins are known, giving the container a single source of truth
 * for what is loaded.
 */
@Injectable()
export class PluginRegistryService {
  private registration: PluginRegistration | undefined;

  /**
   * Records the result of plugin registration.
   *
   * @param registration The registered plugins and their settings
   */
  public register(registration: PluginRegistration) {
    this.registration = registration;
  }

  /**
   * Whether plugin registration has completed.
   *
   * @returns Whether plugins have been registered
   */
  public get isRegistered(): boolean {
    return this.registration !== undefined;
  }

  /**
   * The plugins that passed validation.
   *
   * @returns The valid plugins
   */
  public get plugins(): ValidPluginMap {
    return this.require().plugins;
  }

  /**
   * The resolved plugin settings.
   *
   * @returns The plugin settings
   */
  public get pluginSettings(): PluginSettings {
    return this.require().pluginSettings;
  }

  /**
   * The GraphQL resolvers contributed by the registered plugins.
   *
   * @returns The plugin resolvers
   */
  // oxlint-disable-next-line typescript/no-unsafe-function-type -- Matches the plugin SDK's resolver type.
  public get resolvers(): Function[] {
    return this.plugins
      .values()
      .flatMap(({ config }) => config.resolvers)
      .toArray();
  }

  private require(): PluginRegistration {
    if (!this.registration) {
      throw new Error(
        "Plugins have not been registered yet. The plugin registrar must run before the registry is read.",
      );
    }

    return this.registration;
  }
}

/**
 * Exposes the registered plugins to the DI container.
 */
@Module({
  providers: [PluginRegistryService],
  exports: [PluginRegistryService],
})
export class PluginsModule {}
