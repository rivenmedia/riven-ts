import { RedisConnection } from "bullmq";

import { server } from "#mocks/node.ts";
import { unhandledRequests } from "#mocks/utilities/unhandled-requests.ts";
import { invalidateRankingEngine } from "#ranking/ranking-engine.ts";
import { loadRuntimeSettings } from "#state-machines/bootstrap/actors/load-runtime-settings.actor.ts";
import { syncRankingProfiles } from "#state-machines/bootstrap/actors/sync-ranking-profiles.actor.ts";
import { coreEnvironment, settings } from "#utilities/settings.ts";

import type { Services } from "#database/database.ts";
import type { MockScenario } from "#mocks/utilities/mock-scenario.ts";
import type { SettingsManager } from "#settings/settings-manager.ts";
import type { MikroORM } from "@mikro-orm/core";

export interface ResetInstanceDeps {
  orm: MikroORM;
  services: Services;
  settingsManager: SettingsManager;
}

async function flushRedis() {
  const connection = new RedisConnection({ url: settings.redisUrl });

  try {
    const client = await connection.client;

    await client.flushdb();
  } finally {
    await connection.close();
  }
}

/**
 * Returns a test-mode instance to its boot state, then applies `scenario`:
 * the database, Redis, runtime settings and mock handlers are all reset.
 */
export async function resetInstance(
  { orm, services, settingsManager }: ResetInstanceDeps,
  scenario: MockScenario,
) {
  await orm.schema.clear();
  // Clearing only truncates the default schema's tables, which leaves Better Auth's users behind
  await orm.schema.clear({ schema: "auth_db" });
  await flushRedis();

  await syncRankingProfiles({
    rankingProfileService: services.rankingProfileService,
    settingsService: services.settingsService,
    legacyConfigPath: settings.rankingConfigPath,
  });

  invalidateRankingEngine();
  settingsManager.resetRestartRequired();

  server.resetHandlers(...(scenario.handlers ?? []));
  unhandledRequests.clear();

  await scenario.seed(orm.em.fork());

  // After the seed, which may store settings
  await loadRuntimeSettings({
    settingsService: services.settingsService,
    environment: coreEnvironment,
  });
}
