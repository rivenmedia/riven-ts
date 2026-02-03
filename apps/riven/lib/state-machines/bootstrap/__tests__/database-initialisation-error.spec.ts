import { setTimeout } from "node:timers/promises";
import { expect, vi } from "vitest";
import { fromPromise, toPromise } from "xstate";

import { it } from "./helpers/test-context.ts";

it.scoped({
  initialiseDatabaseConnectionActorLogic: fromPromise(
    vi.fn().mockImplementation(async () => {
      // Simulate a delay to allow the other states to complete,
      // otherwise XState outputs noisy warnings about unhandled transitions.
      await setTimeout(10);

      throw new Error("Database connection failed");
    }),
  ),
});

it("throws an error if the database fails to connect", async ({ actor }) => {
  await expect(toPromise(actor.start())).rejects.toThrow(
    "Database connection failed",
  );
});
