import { createActor, waitFor } from "xstate";

import { rivenMachine } from "./state-machines/program/index.ts";
import { logger } from "./utilities/logger/logger.ts";

process.on("uncaughtException", (error) => {
  logger.error(error);
  console.trace();
});

const sessionId = crypto.randomUUID();

const actor = createActor(rivenMachine, {
  input: {
    sessionId,
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
  process.exit(1);
}

logger.info("Riven has shut down");

process.exit(0);
