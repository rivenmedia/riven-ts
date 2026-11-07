import {
  CreateRequestContext,
  Transactional,
} from "@mikro-orm/decorators/legacy";

import { Setting } from "#database/entities/setting.entity.ts";
import { BaseService } from "#database/services/core/base-service.ts";

export class SettingsService extends BaseService {
  @CreateRequestContext()
  public async getStoredValues(namespace: string) {
    const rows = await this.em.find(Setting, { namespace });

    return Object.fromEntries(rows.map((row) => [row.key, row.value]));
  }

  @CreateRequestContext()
  public async getStoredValuesByNamespace(namespaces: string[]) {
    const result = new Map<string, Record<string, unknown>>();

    if (namespaces.length === 0) {
      return result;
    }

    const rows = await this.em.find(Setting, {
      namespace: { $in: namespaces },
    });

    for (const row of rows) {
      const values = result.get(row.namespace) ?? {};

      values[row.key] = row.value;
      result.set(row.namespace, values);
    }

    return result;
  }

  @CreateRequestContext()
  @Transactional()
  public async writeValues(
    namespace: string,
    changes: { upsert: Record<string, unknown>; delete: string[] },
  ) {
    for (const [key, value] of Object.entries(changes.upsert)) {
      await this.em.upsert(Setting, { namespace, key, value });
    }

    if (changes.delete.length > 0) {
      await this.em.nativeDelete(Setting, {
        namespace,
        key: { $in: changes.delete },
      });
    }
  }
}
