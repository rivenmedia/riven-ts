import { Test } from "@nestjs/testing";
import { randomUUID } from "node:crypto";
import { describe, expect, it as baseIt, vi } from "vitest";
import {
  createActor,
  createEmptyActor,
  fromCallback,
  fromPromise,
} from "xstate";

import { AppModule } from "../app.module.ts";
import { RIVEN_SETTINGS } from "../settings/settings.module.ts";
import * as rivenMachineModule from "../state-machines/program/index.ts";
import { rivenMachine } from "../state-machines/program/index.ts";
import { SessionID } from "../utilities/logger/session-id.ts";
import { settings } from "../utilities/settings.ts";
import { EngineService } from "./engine.module.ts";

import type { BootstrapMachineOutput } from "../state-machines/bootstrap/index.ts";

/**
 * The shutdown timeout is read from the injected settings, so it is overridden
 * on the provider rather than by stubbing the settings module.
 */
const shutdownTimeoutSeconds = 1;

const it = baseIt
  .extend("engine", async ({}, { onCleanup }) => {
    const module = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(RIVEN_SETTINGS)
      .useValue({ ...settings, shutdownTimeoutSeconds })
      .compile();

    onCleanup(async () => {
      await module.close();
    });

    return module.get(EngineService);
  })
  .extend("startEngine", ({ engine }, { onCleanup }) => {
    const actors = new Set<{ stop: () => void }>();

    onCleanup(() => {
      for (const actor of actors) {
        actor.stop();
      }
    });

    return (machineLogic: typeof rivenMachine) => {
      const actor = createActor(machineLogic, {
        input: {
          applicationContext: {} as never,
          sessionId: SessionID.parse(randomUUID()),
          mockScenario: undefined,
        },
      });

      vi.spyOn(rivenMachineModule, "createRivenMachine").mockReturnValue(actor);

      actors.add(actor);

      engine.start({
        applicationContext: {} as never,
        sessionId: SessionID.parse(randomUUID()),
        mockScenario: undefined,
      });

      return actor;
    };
  });

function createMachine(shutdownHangs: boolean) {
  return rivenMachine.provide({
    actors: {
      bootstrapMachine: fromPromise<BootstrapMachineOutput>(async () =>
        Promise.resolve({
          pluginQueues: new Map(),
          plugins: new Map(),
          pluginWorkers: new Map(),
          publishableEvents: new Set(),
          server: {} as never,
          vfs: {} as never,
        }),
      ) as never,
      mainRunnerMachine: fromCallback(() => undefined) as never,
      shutdown: shutdownHangs
        ? (fromPromise(
            async () =>
              new Promise(() => {
                /* Never resolves, simulating a shutdown that hangs. */
              }),
          ) as never)
        : (createEmptyActor() as never),
      stopGqlServer: createEmptyActor() as never,
      unmountVfs: createEmptyActor() as never,
    },
  });
}

describe("draining", () => {
  it("reports success once the program has exited", async ({
    engine,
    startEngine,
  }) => {
    const actor = startEngine(createMachine(false));

    await vi.waitFor(() => {
      expect(actor.getSnapshot().value).toBe("Running");
    });

    actor.send({ type: "riven.core.shutdown" });

    await expect(engine.drain()).resolves.toBe(0);
  });

  // A hung shutdown must not block the process indefinitely: the drain gives up
  // after the configured timeout and reports failure so the caller can exit.
  it("reports failure when the program does not exit within the timeout", async ({
    engine,
    startEngine,
  }) => {
    const actor = startEngine(createMachine(true));

    await vi.waitFor(() => {
      expect(actor.getSnapshot().value).toBe("Running");
    });

    actor.send({ type: "riven.core.shutdown" });

    await expect(engine.drain()).resolves.toBe(1);
  }, 10_000);
});

describe("requesting shutdown", () => {
  it("sends the shutdown event while running", async ({
    engine,
    startEngine,
  }) => {
    const actor = startEngine(createMachine(false));

    await vi.waitFor(() => {
      expect(actor.getSnapshot().value).toBe("Running");
    });

    vi.spyOn(actor, "send");

    engine.requestShutdown();

    expect(actor).toHaveReceivedEvent({ type: "riven.core.shutdown" });
  });
});
