import { RedisConnection } from "bullmq";
import { DateTime } from "luxon";
import { setTimeout } from "node:timers/promises";

import { queueRegistry } from "#message-queue/utilities/queue-registry.ts";
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

const QUIESCE_POLL_INTERVAL_MS = 25;
const QUIESCE_TIMEOUT_MS = 10_000;

/**
 * Pauses every queue Riven created, then waits for their running jobs to
 * finish so that none can write into the instance once it has been reset.
 * Resuming is left to the Redis flush, which removes the pause flag.
 *
 * @public Exported for its spec; only `resetInstance` calls it.
 */
export async function quiesceQueues(timeoutMs = QUIESCE_TIMEOUT_MS) {
  const queues = [...queueRegistry];

  await Promise.all(queues.map(([, queue]) => queue.pause()));

  const deadline = DateTime.now().plus({ milliseconds: timeoutMs });

  for (;;) {
    const counts = await Promise.all(
      queues.map(async ([name, queue]) => ({
        name,
        count: await queue.getActiveCount(),
      })),
    );
    const active = counts
      .filter(({ count }) => count > 0)
      .map(({ name }) => name);

    if (active.length === 0) {
      return;
    }

    if (DateTime.now() >= deadline) {
      throw new Error(
        `Jobs were still active after ${timeoutMs.toString()}ms in: ${active.join(", ")}`,
      );
    }

    await setTimeout(QUIESCE_POLL_INTERVAL_MS);
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
  await quiesceQueues();

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
