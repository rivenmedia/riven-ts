import { Injectable, Module } from "@nestjs/common";
import { Duration } from "luxon";
import { waitFor } from "xstate";

import { InjectLogger } from "../logging/logging.module.ts";
import { InjectSettings } from "../settings/settings.module.ts";
import { createRivenMachine } from "../state-machines/program/index.ts";

import type { RivenLogger } from "../logging/logging.module.ts";
import type { MockScenario } from "../mocks/utilities/mock-scenario.ts";
import type { RivenSettingsValues } from "../settings/settings.module.ts";
import type { rivenMachine } from "../state-machines/program/index.ts";
import type { SessionID } from "../utilities/logger/session-id.ts";
import type { INestApplicationContext } from "@nestjs/common";
import type { ActorRefFromLogic } from "xstate";

export interface StartEngineInput {
  applicationContext: INestApplicationContext;
  sessionId: SessionID;
  mockScenario: MockScenario | undefined;
}

/**
 * Owns the program state machine that drives Riven.
 *
 * Process level concerns - signal handling and exit codes - deliberately stay
 * in the entry point rather than moving to Nest's shutdown hooks, which re-raise
 * the signal after closing and would replace Riven's exit codes with the
 * signal's own.
 */
@Injectable()
export class EngineService {
  private readonly settings: RivenSettingsValues;
  private readonly logger: RivenLogger;
  private actor: ActorRefFromLogic<typeof rivenMachine> | undefined;

  public constructor(
    @InjectSettings() settings: RivenSettingsValues,
    @InjectLogger() logger: RivenLogger,
  ) {
    this.settings = settings;
    this.logger = logger;
  }

  /**
   * Starts the program state machine and begins bootstrapping.
   *
   * @param input The session and any active mock scenario
   *
   * @returns The running actor
   */
  public start({
    applicationContext,
    sessionId,
    mockScenario,
  }: StartEngineInput) {
    const actor = createRivenMachine({
      applicationContext,
      sessionId,
      mockScenario,
    });

    this.actor = actor;

    actor.start();
    actor.send({ type: "BOOTSTRAP" });

    return actor;
  }

  /**
   * Asks the program to shut down, if it is in a state that can be shut down.
   */
  public requestShutdown() {
    const snapshot = this.actor?.getSnapshot();

    if (!snapshot) {
      return;
    }

    const shutdownableStates: (typeof snapshot.value)[] = [
      "Running",
      "Bootstrapping",
    ];

    if (shutdownableStates.includes(snapshot.value)) {
      this.actor?.send({ type: "riven.core.shutdown" });
    }
  }

  /**
   * Resolves once the program has reached its shutdown state.
   */
  public async waitForShutdown() {
    if (!this.actor) {
      return;
    }

    await waitFor(this.actor, (state) => state.matches("Shutdown"), {
      timeout: Number.POSITIVE_INFINITY,
    });
  }

  /**
   * Waits for the program to finish shutting down.
   *
   * @returns The exit code the process should use
   */
  public async drain(): Promise<number> {
    if (!this.actor) {
      return 0;
    }

    const shutdownTimeoutMs = Duration.fromObject({
      seconds: this.settings.shutdownTimeoutSeconds,
    }).as("milliseconds");

    try {
      const { value } = await waitFor(
        this.actor,
        (state) => state.matches("Exited") || state.matches("Errored"),
        { timeout: shutdownTimeoutMs },
      );

      return Number(value === "Errored");
    } catch (error) {
      this.logger.error("Error whilst waiting for shutdown", { err: error });

      return 1;
    }
  }
}

/**
 * Exposes the program state machine to the DI container.
 */
@Module({
  providers: [EngineService],
  exports: [EngineService],
})
export class EngineModule {}
