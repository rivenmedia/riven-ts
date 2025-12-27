import { bootstrapMachine } from "./state-machines/bootstrap/index.ts";
import { logger } from "@repo/core-util-logger";
import { createActor } from "xstate";

const actor = createActor(bootstrapMachine);

actor.start();
actor.send({ type: "START" });

actor.on("riven.exited", () => {
  actor.stop();
});

process.on("SIGINT", () => {
  actor.send({ type: "EXIT" });
});

await new Promise<void>((resolve) => {
  // Prevent the program from exiting immediately by
  // adding a long-running timer into the event loop.
  const timerId = setInterval(() => null, Math.pow(2, 31) - 1);

  actor.on("riven.exited", () => {
    clearInterval(timerId);
    resolve();
  });
});

logger.info("Riven has shut down");
