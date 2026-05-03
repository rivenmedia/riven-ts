import { randomUUID } from "node:crypto";
import { setEnvironmentData } from "node:worker_threads";

import { SessionID, withLogContext } from "./utilities/logger/log-context.ts";

const sessionId = SessionID.parse(randomUUID());

setEnvironmentData("riven.session.id", sessionId);

await withLogContext(
  {
    "riven.log.source": "core",
    "riven.session.id": sessionId,
  },
  async () => {
    await import("./sentry.ts");

    const { createActor, waitFor } = await import("xstate");

    const { rivenMachine } = await import("./state-machines/program/index.ts");
    const { logger } = await import("./utilities/logger/logger.ts");

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
  },
);
