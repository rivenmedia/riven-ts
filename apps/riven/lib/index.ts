import { bootstrapMachine } from "./state-machines/bootstrap/index.ts";
import { KeyvAdapter } from "@apollo/utils.keyvadapter";
import { postgresDataSource } from "@repo/core-util-database/connection";
import { logger } from "@repo/core-util-logger";
import { createActor } from "xstate";
import KeyvRedis, { Keyv } from "@keyv/redis";

await postgresDataSource.initialize();

const cache = new KeyvAdapter(
  new Keyv(new KeyvRedis(process.env["REDIS_URL"])) as never,
);

const actor = createActor(bootstrapMachine, {
  input: {
    cache,
  },
});

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
