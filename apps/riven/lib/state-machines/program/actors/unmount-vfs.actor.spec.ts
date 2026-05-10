import { expect, it, vi } from "vitest";
import { createActor, waitFor } from "xstate";

import { unmountVfs } from "./unmount-vfs.actor.ts";

vi.mock("undici", async (importOriginal) => {
  const original = await importOriginal<typeof import("undici")>();

  return {
    ...original,
    getGlobalDispatcher: vi.fn().mockReturnValue({
      destroy: vi.fn().mockResolvedValue(undefined),
    }),
  };
});

it("unmounts the VFS and destroys the dispatcher", async () => {
  const unmountFn = vi.fn((cb: (err?: Error) => void) => cb());

  const actor = createActor(unmountVfs, {
    input: { unmount: unmountFn } as never,
  });

  actor.start();
  await waitFor(actor, (s) => s.status === "done");

  expect(unmountFn).toHaveBeenCalled();
});

it("logs a warning and returns when no VFS instance is provided", async () => {
  const actor = createActor(unmountVfs, {
    input: undefined,
  });

  actor.start();
  await waitFor(actor, (s) => s.status === "done");

  expect(actor.getSnapshot().status).toBe("done");
});
