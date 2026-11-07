import { expect, it, vi } from "vitest";
import { createActor, createMachine } from "xstate";

import { createEventScheduler } from "../actors/event-scheduler.actor.ts";

function startScheduler(interval: number) {
  const parent = createActor(
    createMachine({
      invoke: {
        src: createEventScheduler,
        input: {
          event: "riven-internal.retry-library",
          interval,
          runImmediately: true,
        },
      },
    }),
  );

  const sendSpy = vi.fn<() => void>();

  parent.system.inspect((event) => {
    if (
      event.type === "@xstate.event" &&
      event.event.type === "riven-internal.retry-library"
    ) {
      sendSpy();
    }
  });

  parent.start();

  return { parent, sendSpy };
}

it("sends the event at the configured interval", () => {
  vi.useFakeTimers();

  const { parent, sendSpy } = startScheduler(1000);

  vi.advanceTimersByTime(2000);

  expect(sendSpy).toHaveBeenCalledTimes(3);

  parent.stop();
});

it("does not schedule the event when the interval is 0", () => {
  vi.useFakeTimers();

  const { parent, sendSpy } = startScheduler(0);

  vi.advanceTimersByTime(2000);

  expect(sendSpy).not.toHaveBeenCalled();

  parent.stop();
});
