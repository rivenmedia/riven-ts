import { logger } from "@repo/core-util-logger";

import { LRUCache } from "lru-cache";
import safeStringify from "safe-stringify";
import { type AnyEventObject, createActor, waitFor } from "xstate";

import { rivenMachine } from "./state-machines/program/index.ts";

const sessionId = crypto.randomUUID();

const eventsCache = new LRUCache<string, AnyEventObject>({ max: 100000 });

const actor = createActor(rivenMachine, {
  input: {
    sessionId,
  },
  inspect(inspectionEvent) {
    if (
      inspectionEvent.type === "@xstate.event" &&
      inspectionEvent.event.type.startsWith("riven")
    ) {
      eventsCache.set(
        safeStringify(inspectionEvent.event),
        inspectionEvent.event,
      );
    }
  },
});

actor.start();

process.on("SIGINT", () => {
  actor.send({ type: "riven.core.shutdown" });
});

await waitFor(
  actor,
  (state) => state.matches("Exited") || state.matches("Errored"),
);

const { value } = actor.getSnapshot();

if (value === "Errored") {
  logger.error(
    `Riven encountered a fatal error. Persisting events to Redis [riven:events-cache:${sessionId}] for debugging...`,
  );

  process.exit(1);
}

logger.info("Riven has shut down");

process.exit(0);
