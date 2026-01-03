import { expect, vi } from "vitest";
import { createActor, fromPromise } from "xstate";

import { it } from "./helpers/test-context.ts";

it('transitions to "Shutdown" then "Exited" when the "riven.shutdown" event is sent', async ({
  actor,
}) => {
  actor.start().send({ type: "riven.shutdown" });

  expect(actor.getSnapshot().value).toBe("Shutdown");

  await vi.waitFor(() => {
    expect(actor.getSnapshot().value).toBe("Exited");
  });
});

it("stops the GraphQL server when shutting down", async ({
  machine,
  input,
}) => {
  const stopGqlServerMock = vi.fn().mockResolvedValue(undefined);

  const actor = createActor(
    machine.provide({
      actors: {
        stopGqlServer: fromPromise(stopGqlServerMock),
      },
    }),
    {
      input,
    },
  );

  actor.start().send({ type: "riven.shutdown" });

  await vi.waitFor(() => {
    expect(actor.getSnapshot().value).toBe("Exited");
  });

  expect(stopGqlServerMock).toHaveBeenCalledOnce();
});
