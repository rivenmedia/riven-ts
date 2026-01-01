import { expect, vi } from "vitest";
import { fromPromise } from "xstate";

import { it } from "./helpers/test-context.ts";

it.scoped({
  // @ts-expect-error Testing error case
  // eslint-disable-next-line @typescript-eslint/require-await
  initialiseDatabaseConnectionActor: fromPromise(async () => {
    throw new Error("Database connection failed");
  }),
});

it('transitions to the "Errored" state', async ({ actor }) => {
  actor.send({ type: "START" });

  await vi.waitFor(() => {
    expect(actor.getSnapshot().value).toBe("Errored");
  });
});
