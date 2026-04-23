import "./sentry.ts";

import * as Sentry from "@sentry/node";
import { randomUUID } from "node:crypto";
import { createActor, waitFor } from "xstate";

import { logger } from "./utilities/logger/logger.ts";

await Sentry.withScope(async (scope) => {
  const sessionId = randomUUID();

  scope.setTags({
    "riven.log.source": "core",
    "riven.session.id": sessionId,
  });

  // Dynamically import the main state machine so the log action obtains the current scope
  const { rivenMachine } = await import("./state-machines/program/index.ts");

  process.on("uncaughtException", (error) => {
    logger.error("Uncaught exception", { err: error });

    process.exit(1);
  });

  process.on("unhandledRejection", (error) => {
    logger.error("Uncaught rejection", { err: error });
  });

  const actor = createActor(rivenMachine, {
    input: {
      sessionId,
    },
  });

  actor.start();

  process.on("SIGINT", () => {
    const { value } = actor.getSnapshot();
    const stoppableStates: (typeof value)[] = ["Running", "Bootstrapping"];

    if (stoppableStates.includes(value)) {
      actor.send({ type: "riven.core.shutdown" });
    }
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
