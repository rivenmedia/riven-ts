import { expect, vi } from "vitest";
import { fromPromise, toPromise } from "xstate";

import { it } from "./helpers/test-context.ts";

it.scoped({
  startGqlServerActorLogic: fromPromise(
    vi.fn().mockRejectedValue("GraphQL server failed to start"),
  ),
});

it('transitions to the "Errored" state', async ({ actor }) => {
  await expect(toPromise(actor.start())).rejects.toThrow(
    "GraphQL server failed to start",
  );
});
