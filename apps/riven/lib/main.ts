#!/usr/bin/env node

import "reflect-metadata";
import { randomUUID } from "node:crypto";
import { setEnvironmentData } from "node:worker_threads";

import { withLogContext } from "./utilities/logger/log-context.ts";
import { SessionID } from "./utilities/logger/session-id.ts";

import type { LogContext } from "./utilities/logger/log-context.ts";

/**
 * The main entry point for Riven.
 *
 * The order here is deliberate. Any mock scenario must be applied to the
 * environment before the settings, logger and Sentry modules are evaluated,
 * since each reads the environment as it is imported - and creating the Nest
 * container imports all of them. Everything below the container creation is
 * therefore reached through dynamic imports.
 */
export async function main() {
  const sessionId = SessionID.parse(randomUUID());

  setEnvironmentData("riven.session.id", sessionId);

  const baseLogContext: LogContext = {
    "riven.log.source": "core",
    "riven.session.id": sessionId,
  };

  await withLogContext(baseLogContext, async () => {
    const isMockingEnabled = Boolean(process.env["MOCK_SCENARIO"]);
    const { mockScenario, server } = isMockingEnabled
      ? await import("./mocks/node.ts")
      : {};

    if (mockScenario) {
      Object.assign(
        process.env,
        Object.fromEntries(
          Object.entries(mockScenario.environmentData).map(([key, value]) => [
            key,
            JSON.stringify(value),
          ]),
        ),
      );
    }

    await import("./sentry.ts");
    await import("./ranking-config/ranking-config.ts");

    const { NestFactory } = await import("@nestjs/core");
    const { AppModule } = await import("./app.module.ts");
    const { EngineService } = await import("./engine/engine.module.ts");
    const { logger } = await import("./utilities/logger/logger.ts");

    const applicationContext = await NestFactory.createApplicationContext(
      AppModule,
      { logger: false },
    );

    const engine = applicationContext.get(EngineService);

    if (mockScenario) {
      logger.warn(
        `Mocks are enabled with the "${mockScenario.scenarioName}" scenario.`,
      );
    }

    async function shutdown() {
      process.exitCode ??= await engine.drain();

      logger.info(`Riven exited with code ${process.exitCode.toString()}`);

      await applicationContext.close();

      server?.close();

      process.exit();
    }

    function handleUncaughtException(error: unknown) {
      process.exitCode = 1;

      withLogContext(baseLogContext, () => {
        logger.error("Uncaught exception", { err: error });

        engine.requestShutdown();
      });
    }

    function handleUnhandledRejection(error: unknown) {
      withLogContext(baseLogContext, () => {
        logger.error("Uncaught rejection", { err: error });
      });
    }

    const terminationSignals: NodeJS.Signals[] = ["SIGINT", "SIGTERM"];
    const terminationSignalHandlers = new Map(
      terminationSignals.map((signal) => [
        signal,
        () => {
          engine.requestShutdown();

          withLogContext(baseLogContext, () => {
            logger.debug(`Received ${signal}`);
          });
        },
      ]),
    );

    process.on("uncaughtException", handleUncaughtException);
    process.on("unhandledRejection", handleUnhandledRejection);

    for (const [signal, handler] of terminationSignalHandlers) {
      process.on(signal, handler);
    }

    engine.start({ applicationContext, sessionId, mockScenario });

    await engine.waitForShutdown();

    // Remove any registered process listeners.
    // This is less important in production, but poses a problem in tests:
    // When a test runner spawns multiple workers, any worker that runs this file
    // causes a stack of unused handlers to accumulate, eventually causing the process to hang.

    process.off("uncaughtException", handleUncaughtException);
    process.off("unhandledRejection", handleUnhandledRejection);

    for (const [signal, handler] of terminationSignalHandlers) {
      process.off(signal, handler);
    }

    await shutdown();
  });
}
