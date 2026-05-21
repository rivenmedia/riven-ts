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
 */
function maybeSendShutdownEvent(actor: ActorRefFromLogic<typeof rivenMachine>) {
  const { value } = actor.getSnapshot();
  const runningStates: (typeof value)[] = ["Running", "Bootstrapping"];

  if (runningStates.includes(value)) {
    actor.send({ type: "riven.core.shutdown" });
  }
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
    await import("./ranking-config/ranking-config.ts");

    const { waitFor } = await import("xstate");

    const { createRivenMachine } =
      await import("./state-machines/program/index.ts");
    const { logger } = await import("./utilities/logger/logger.ts");
    const { settings } = await import("./utilities/settings.ts");

    const shutdownTimeoutMs = Duration.fromObject({
      seconds: settings.shutdownTimeoutSeconds,
    }).as("milliseconds");

    const actor = createRivenMachine({
      sessionId,
    });

    async function shutdown() {
      process.exitCode ??= 0;

      try {
        const { value } = await waitFor(
          actor,
          (state) => state.matches("Exited") || state.matches("Errored"),
          { timeout: shutdownTimeoutMs },
        );

        process.exitCode ??= Number(value === "Errored");
      } catch (error) {
        if (process.exitCode === 0) {
          process.exitCode = 1;
        }

        logger.error("Error whilst waiting for shutdown", { err: error });
      }

      logger.info(`Riven exited with code ${process.exitCode.toString()}`);

      process.exit();
    }

    process.on("uncaughtException", (error) => {
      process.exitCode = 1;

      withLogContext(baseLogContext, () => {
        logger.error("Uncaught exception", { err: error });

        maybeSendShutdownEvent(actor);
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
        maybeSendShutdownEvent(actor);

        withLogContext(baseLogContext, () => {
          logger.debug(`Received ${signal}`);
        });
      });
    }

    await waitFor(actor, (state) => state.matches("Shutdown"));

    await shutdown();
  });
}
