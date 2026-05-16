import { randomUUID } from "node:crypto";
import { setEnvironmentData } from "node:worker_threads";

import {
  type LogContext,
  SessionID,
  withLogContext,
} from "./utilities/logger/log-context.ts";

import type { rivenMachine } from "./state-machines/program/index.ts";
import type { ActorRefFromLogic } from "xstate";

const sessionId = SessionID.parse(randomUUID());

setEnvironmentData("riven.session.id", sessionId);

const baseLogContext: LogContext = {
  "riven.log.source": "core",
  "riven.session.id": sessionId,
};

/**
 * Conditionally sends a shutdown event to the program state machine if it's in a state that can be shutdown.
 *
 * @param actor The program state machine
 * @returns true if a shutdown event was sent, otherwise false
 */
function maybeSendShutdownEvent(actor: ActorRefFromLogic<typeof rivenMachine>) {
  const { value } = actor.getSnapshot();
  const stoppableStates: (typeof value)[] = ["Running", "Bootstrapping"];

  if (stoppableStates.includes(value)) {
    actor.send({ type: "riven.core.shutdown" });

    return true;
  }

  return false;
}

await withLogContext(baseLogContext, async () => {
  await import("./sentry.ts");

  const { createActor, waitFor } = await import("xstate");

  const { rivenMachine } = await import("./state-machines/program/index.ts");
  const { logger } = await import("./utilities/logger/logger.ts");

  const actor = createActor(rivenMachine, {
    input: {
      sessionId,
    },
  });

  process.on("uncaughtException", (error) => {
    process.exitCode = 1;

    withLogContext(baseLogContext, () => {
      logger.error("Uncaught exception", { err: error });

      if (maybeSendShutdownEvent(actor)) {
        const signal = AbortSignal.timeout(10_000);

        signal.addEventListener("abort", () => {
          logger.error("Timeout whilst waiting for shutdown; forcing exit");

          process.exit();
        });

        waitFor(
          actor,
          (state) => state.matches("Exited") || state.matches("Errored"),
        ).catch((error: unknown) => {
          logger.error("Error while waiting for shutdown", { err: error });

          process.exit();
        });
      }
    });
  });

  process.on("unhandledRejection", (error) => {
    withLogContext(baseLogContext, () => {
      logger.error("Uncaught rejection", { err: error });
    });
  });

  actor.start();

  const terminationSignals: NodeJS.Signals[] = ["SIGINT", "SIGTERM"];

  for (const signal of terminationSignals) {
    process.on(signal, () => {
      maybeSendShutdownEvent(actor);
    });
  }

  await waitFor(
    actor,
    (state) => state.matches("Exited") || state.matches("Errored"),
  );

  const { value } = actor.getSnapshot();

  if (value === "Errored") {
    process.exitCode = 1;
  }
});
