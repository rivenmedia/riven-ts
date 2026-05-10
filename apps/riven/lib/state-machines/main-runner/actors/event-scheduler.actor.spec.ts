import { expect, it, vi } from "vitest";
import { createActor } from "xstate";

import { createEventScheduler } from "./event-scheduler.actor.ts";

it("clears interval on stop", () => {
  vi.useFakeTimers();
  const clearIntervalSpy = vi.spyOn(globalThis, "clearInterval");

  const actor = createActor(createEventScheduler, {
    input: {
      interval: 1000,
      event: "riven-internal.retry-library" as never,
      runImmediately: false,
    },
  });

  actor.start();
  actor.stop();

  expect(clearIntervalSpy).toHaveBeenCalled();

  clearIntervalSpy.mockRestore();
  vi.useRealTimers();
});
