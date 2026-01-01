import { postgresDataSource } from "@repo/core-util-database/connection";
import { logger } from "@repo/core-util-logger";

import { KeyvAdapter } from "@apollo/utils.keyvadapter";
import KeyvRedis, { Keyv } from "@keyv/redis";
import { LRUCache } from "lru-cache";
import { type AnyEventObject, createActor, waitFor } from "xstate";

import { bootstrapMachine } from "./state-machines/bootstrap/index.ts";

const sessionId = crypto.randomUUID();

await postgresDataSource.initialize();

const cache = new KeyvAdapter(
  new Keyv(new KeyvRedis(process.env["REDIS_URL"])) as never,
);

const eventsCache = new LRUCache<string, AnyEventObject>({ max: 1000 });

const actor = createActor(bootstrapMachine, {
  input: {
    cache,
    sessionId,
  },
  inspect(inspectionEvent) {
    if (inspectionEvent.type === "@xstate.event") {
      eventsCache.set(inspectionEvent.event.type, inspectionEvent.event);
    }
  },
});

async function persistEvents() {
  await cache.set(
    `riven:events-cache:${sessionId}`,
    JSON.stringify(eventsCache.dump()),
  );

  logger.info(`Persisted Riven events cache for session ${sessionId}`);
}

const persistEventsIntervalId = setInterval(() => {
  void persistEvents();
}, 60_000);

actor.start();
actor.send({ type: "START" });

process.on("SIGINT", () => {
  actor.send({ type: "EXIT" });
});

await waitFor(
  actor,
  (state) => state.matches("Exited") || state.matches("Errored"),
);

const { value } = actor.getSnapshot();

clearInterval(persistEventsIntervalId);

if (value === "Errored") {
  logger.error(
    "Riven encountered a fatal error. Persisting events to cache for debugging...",
  );

  await persistEvents();

  process.exit(1);
}

logger.info("Riven has shut down");

process.exit(0);
