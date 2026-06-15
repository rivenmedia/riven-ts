import { CreateRequestContext } from "@mikro-orm/decorators/legacy";

import { Setting } from "../../entities/settings.entity.ts";
import { BaseService } from "../core/base-service.ts";

export class SettingsService extends BaseService {
  @CreateRequestContext()
  async getSettingsByNamespace(namespace: string) {
    const settings = await this.em.find(Setting, { namespace });

    return Object.fromEntries(settings.map((s) => [s.key, s.value]));
  }

  @CreateRequestContext()
  async saveBulkSettings(settings: Setting[]) {
    await this.em.upsertMany(Setting, settings, {
      onConflictExcludeFields: ["value"],
    });
  }
}
