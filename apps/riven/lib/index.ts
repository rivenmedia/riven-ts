import { randomUUID } from "node:crypto";
import { setEnvironmentData } from "node:worker_threads";

import {
  type LogContext,
  SessionID,
  withLogContext,
} from "./utilities/logger/log-context.ts";

const sessionId = SessionID.parse(randomUUID());

setEnvironmentData("riven.session.id", sessionId);

const baseLogContext: LogContext = {
  "riven.log.source": "core",
  "riven.session.id": sessionId,
};

await withLogContext(baseLogContext, async () => {
  await import("./sentry.ts");

  const { createActor, waitFor } = await import("xstate");

  const { rivenMachine } = await import("./state-machines/program/index.ts");
  const { logger } = await import("./utilities/logger/logger.ts");

  // Node fires `uncaughtException` and `unhandledRejection` listeners from
  // a fresh execution context, not the AsyncLocalStorage scope of the
  // registration site. Without an explicit `withLogContext` wrap here, the
  // `logger.error(...)` calls below resolve no log context and trip the
  // intentional throw in `getLogContext`, which masks the original error
  // in `exceptions.log` and exits the process. Re-establish the same base
  // context on each invocation so the logger can do its job.
  process.on("uncaughtException", (error) => {
    withLogContext(baseLogContext, () => {
      logger.error("Uncaught exception", { err: error });

      process.exit(1);
    });
  });

  process.on("unhandledRejection", (error) => {
    withLogContext(baseLogContext, () => {
      logger.error("Uncaught rejection", { err: error });
    });
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
