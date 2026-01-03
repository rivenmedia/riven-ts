import { expect, vi } from "vitest";
import { fromPromise, toPromise } from "xstate";

import { it } from "./helpers/test-context.ts";

it.scoped({
  startGqlServerActorLogic: fromPromise(
    vi.fn().mockImplementation(async () => {
      // Simulate a delay to allow the other states to complete,
      // otherwise XState outputs noisy warnings about unhandled transitions.
      await new Promise((resolve) => setTimeout(resolve, 10));

      throw new Error("GraphQL server failed to start");
    }),
  ),
});

it('transitions to the "Errored" state', async ({ actor }) => {
  await expect(toPromise(actor.start())).rejects.toThrow(
    "GraphQL server failed to start",
  );
});
