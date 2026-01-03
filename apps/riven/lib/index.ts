import { logger } from "@repo/core-util-logger";

import { LRUCache } from "lru-cache";
import safeStringify from "safe-stringify";
import { type AnyEventObject, createActor, waitFor } from "xstate";

import { rivenMachine } from "./state-machines/program/index.ts";
import { redisCache } from "./utilities/redis-cache.ts";

const sessionId = crypto.randomUUID();

const eventsCache = new LRUCache<string, AnyEventObject>({ max: 100000 });

const actor = createActor(rivenMachine, {
  input: {
    sessionId,
  },
  inspect(inspectionEvent) {
    if (inspectionEvent.type === "@xstate.event") {
      if (inspectionEvent.actorRef !== actor) {
        return;
      }

      eventsCache.set(
        safeStringify(inspectionEvent.event),
        inspectionEvent.event,
      );
    }
  },
});

async function persistEvents() {
  const value = eventsCache.dump();

  await redisCache.set(`riven:events-cache:${sessionId}`, safeStringify(value));

  logger.info(`Persisted Riven events cache for session ${sessionId}`);
}

const persistEventsIntervalId = setInterval(() => {
  void persistEvents();
}, 10_000);

actor.start();

process.on("SIGINT", () => {
  actor.send({ type: "riven.shutdown" });
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
