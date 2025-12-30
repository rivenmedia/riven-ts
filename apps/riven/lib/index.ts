import { bootstrapMachine } from "./state-machines/bootstrap/index.ts";
import { KeyvAdapter } from "@apollo/utils.keyvadapter";
import { postgresDataSource } from "@repo/core-util-database/connection";
import { logger } from "@repo/core-util-logger";
import { createActor, waitFor } from "xstate";
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

process.on("SIGINT", () => {
  actor.send({ type: "EXIT" });
});

await waitFor(actor, (state) => state.matches("Exited"));

logger.info("Riven has shut down");

process.exit(0);
