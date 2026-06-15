import { CreateRequestContext } from "@mikro-orm/decorators/legacy";

import { Setting } from "../../entities/settings.entity.ts";
import { BaseService } from "../core/base-service.ts";

export class SettingsService extends BaseService {
  @CreateRequestContext()
  async getSettingsByNamespace(namespace: string) {
    return this.em.find(Setting, { namespace });
  }

  @CreateRequestContext()
  async saveBulkSettings(settings: Setting[]) {
    await this.em.upsertMany(Setting, settings, {
      onConflictExcludeFields: ["value"],
    });
  }
}
