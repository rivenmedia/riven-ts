import { expect, it, vi } from "vitest";
import { createActor } from "xstate";

import { stopGqlServer } from "./stop-gql-server.actor.ts";

it("stops the server if provided", async () => {
  const stopSpy = vi.fn();

  const actor = createActor(stopGqlServer, {
    input: {
      stop: stopSpy,
    } as never,
  });

  actor.start();

  expect(stopSpy).toHaveBeenCalled();
});
