import { expect, vi } from "vitest";
import { fromPromise, toPromise } from "xstate";

import { it } from "./helpers/test-context.ts";

it.scoped({
  initialiseDatabaseConnectionActorLogic: fromPromise(
    vi.fn().mockRejectedValue("Database connection failed"),
  ),
});

it("throws an error if the database fails to connect", async ({ actor }) => {
  await expect(toPromise(actor.start())).rejects.toThrow(
    "Database connection failed",
  );
});
