import { CreateRequestContext } from "@mikro-orm/decorators/legacy";

import { Setting } from "../../entities/settings.entity.ts";
import { BaseService } from "../core/base-service.ts";

export class SettingsService extends BaseService {
  #buildSettingsObject(settings: Setting[]) {
    return Object.fromEntries(settings.map(({ key, value }) => [key, value]));
  }

  @CreateRequestContext()
  async getAllPluginSettings() {
    const settings = await this.em.find(Setting, {
      namespace: {
        $nin: ["@repo/riven"],
      },
    });

    return settings.reduce((acc, { namespace, key, value }) => {
      const namespaceSettings =
        acc.get(namespace) ?? new Map<string, unknown>();

      if (!acc.has(namespace)) {
        acc.set(namespace, namespaceSettings);
      }

      namespaceSettings.set(key, value);

      return acc;
    }, new Map<string, Map<string, unknown>>());
  }

  @CreateRequestContext()
  async getSettingsByNamespace(namespace: string) {
    const settings = await this.em.find(Setting, { namespace });

    return this.#buildSettingsObject(settings);
  }

  @CreateRequestContext()
  async saveBulkSettings(settings: Setting[]) {
    await this.em.upsertMany(Setting, settings, {
      onConflictExcludeFields: ["value"],
    });
  }
}
