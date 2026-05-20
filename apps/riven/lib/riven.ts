import { Duration } from "luxon";
import { randomUUID } from "node:crypto";
import { setEnvironmentData } from "node:worker_threads";

import {
  type LogContext,
  withLogContext,
} from "./utilities/logger/log-context.ts";
import { SessionID } from "./utilities/logger/session-id.ts";

import type { rivenMachine } from "./state-machines/program/index.ts";
import type { ActorRefFromLogic } from "xstate";

/**
 * Conditionally sends a shutdown event to the program state machine if it's in a state that can be shutdown.
 *
 * @param actor The program state machine
 * @returns true if a shutdown event was sent, otherwise false
 */
async function maybeSendShutdownEvent(
  actor: ActorRefFromLogic<typeof rivenMachine>,
) {
  const { value } = actor.getSnapshot();
  const stoppableStates: (typeof value)[] = ["Running", "Bootstrapping"];

  if (stoppableStates.includes(value)) {
    actor.send({ type: "riven.core.shutdown" });

    const { logger } = await import("./utilities/logger/logger.ts");
    const { settings } = await import("./utilities/settings.ts");

    const timeoutMs = Duration.fromObject({
      seconds: settings.shutdownTimeoutSeconds,
    }).as("milliseconds");

    const signal = AbortSignal.timeout(timeoutMs);

    signal.addEventListener("abort", () => {
      logger.error("Timeout whilst waiting for shutdown; forcing exit");

      process.exit();
    });

    return true;
  }

  return false;
}

/**
 * The main entry point for Riven.
 */
export async function riven() {
  const sessionId = SessionID.parse(randomUUID());

  setEnvironmentData("riven.session.id", sessionId);

  const baseLogContext: LogContext = {
    "riven.log.source": "core",
    "riven.session.id": sessionId,
  };

  await withLogContext(baseLogContext, async () => {
    await import("./sentry.ts");

    const { waitFor } = await import("xstate");

    const { createRivenMachine } =
      await import("./state-machines/program/index.ts");
    const { logger } = await import("./utilities/logger/logger.ts");

    const actor = createRivenMachine({
      sessionId,
    });

    process.on("uncaughtException", (error) => {
      process.exitCode = 1;

      withLogContext(baseLogContext, async () => {
        logger.error("Uncaught exception", { err: error });

        if (await maybeSendShutdownEvent(actor)) {
          waitFor(
            actor,
            (state) => state.matches("Exited") || state.matches("Errored"),
          ).catch((error: unknown) => {
            logger.error("Error whilst waiting for shutdown", { err: error });

            process.exit();
          });
        }
      }).catch((error: unknown) => {
        logger.error("Error in uncaughtException handler", { err: error });
      });
    });

    process.on("unhandledRejection", (error) => {
      withLogContext(baseLogContext, () => {
        logger.error("Uncaught rejection", { err: error });
      });
    });

    actor.start();
    actor.send({ type: "BOOTSTRAP" });

    const terminationSignals: NodeJS.Signals[] = ["SIGINT", "SIGTERM"];

    for (const signal of terminationSignals) {
      process.on(signal, () => {
        maybeSendShutdownEvent(actor).catch((error: unknown) => {
          logger.error("Error whilst sending shutdown event", { err: error });
        });

        withLogContext(baseLogContext, () => {
          logger.debug(`Received ${signal}`);
        });
      });
    }

    await waitFor(
      actor,
      (state) => state.matches("Exited") || state.matches("Errored"),
    );

    const { value } = actor.getSnapshot();

    process.exitCode = Number(value === "Errored");

    logger.info(`Riven exited with code ${process.exitCode.toString()}`);
  });

  process.exit();
}
