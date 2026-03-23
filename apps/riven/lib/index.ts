import * as Sentry from "@sentry/node";
import { createActor, waitFor } from "xstate";

import { logger } from "./utilities/logger/logger.ts";

await Sentry.withScope(async (scope) => {
  scope.setTags({
    "riven.log.source": "core",
  });

  // Dynamically import the main state machine so the log action obtains the current scope
  const { rivenMachine } = await import("./state-machines/program/index.ts");

  process.on("uncaughtException", (error) => {
    logger.error("Uncaught exception", { err: error });
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
});
