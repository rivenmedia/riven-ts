import {
  CreateRequestContext,
  Transactional,
} from "@mikro-orm/decorators/legacy";

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

  /**
   * Saves settings in bulk, creating new settings if they don't exist and updating existing ones.
   */
  @CreateRequestContext()
  async saveBulkSettings(settings: Setting[]) {
    await this.em.upsertMany(Setting, settings, {
      onConflictMergeFields: ["value"],
    });
  }

  /**
   * Bulk updates settings, ignoring any non-existent settings.
   */
  @CreateRequestContext()
  @Transactional()
  async updateBulkSettings(settings: Setting[]) {
    for (const setting of settings) {
      const existingSetting = await this.em.findOne(Setting, {
        key: setting.key,
        namespace: setting.namespace,
      });

      if (!existingSetting) {
        continue;
      }

      existingSetting.value = setting.value;
    }
  }
}
