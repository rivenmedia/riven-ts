import { expect, vi } from "vitest";
import { createActor, fromPromise } from "xstate";

import { it } from "./helpers/test-context.ts";

it('transitions to "Shutdown" then "Exited" when the "riven.shutdown" event is sent', async ({
  actor,
}) => {
  actor.start().send({ type: "riven.core.shutdown" });

  expect(actor.getSnapshot().value).toStrictEqual({
    Shutdown: {
      "Shutting down GQL server": "Shutting down",
      "Unmounting VFS": "Unmounting",
    },
  });

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
    { input },
  );

  actor.start().send({ type: "riven.core.shutdown" });

  await vi.waitFor(() => {
    expect(actor.getSnapshot().value).toBe("Exited");
  });

  expect(stopGqlServerMock).toHaveBeenCalledOnce();
});

it("unmounts the VFS when shutting down", async ({ machine, input }) => {
  const unmountVfsMock = vi.fn().mockResolvedValue(undefined);
  const actor = createActor(
    machine.provide({
      actors: {
        unmountVfs: fromPromise(unmountVfsMock),
      },
    }),
    { input },
  );

  actor.start().send({ type: "riven.core.shutdown" });

  await vi.waitFor(() => {
    expect(actor.getSnapshot().value).toBe("Exited");
  });

  expect(unmountVfsMock).toHaveBeenCalledOnce();
});
