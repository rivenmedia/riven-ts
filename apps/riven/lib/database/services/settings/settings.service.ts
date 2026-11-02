import { EnsureRequestContext } from "@mikro-orm/decorators/legacy";

import { Setting } from "#database/entities/setting.entity.ts";
import { BaseService } from "#database/services/core/base-service.ts";

export class SettingsService extends BaseService {
  @EnsureRequestContext()
  public async getStoredValues(namespace: string) {
    const rows = await this.em.fork().find(Setting, { namespace });

    return Object.fromEntries(rows.map((row) => [row.key, row.value]));
  }

  @EnsureRequestContext()
  public async getStoredValuesByNamespace(namespaces: string[]) {
    const result = new Map<string, Record<string, unknown>>();

    if (namespaces.length === 0) {
      return result;
    }

    const rows = await this.em
      .fork()
      .find(Setting, { namespace: { $in: namespaces } });

    for (const row of rows) {
      const values = result.get(row.namespace) ?? {};

      values[row.key] = row.value;
      result.set(row.namespace, values);
    }

    return result;
  }

  @EnsureRequestContext()
  public async writeValues(
    namespace: string,
    changes: { upsert: Record<string, unknown>; delete: string[] },
  ) {
    await this.em.fork().transactional(async (em) => {
      for (const [key, value] of Object.entries(changes.upsert)) {
        await em.upsert(Setting, { namespace, key, value });
      }

      if (changes.delete.length > 0) {
        await em.nativeDelete(Setting, {
          namespace,
          key: { $in: changes.delete },
        });
      }
    });
  }
}
