import { it } from "./helpers/test-context.ts";
import { waitFor } from "xstate";
import { expect } from "vitest";

it('transitions to "Shutdown" state on EXIT event', ({ actor }) => {
  actor.send({ type: "EXIT" });

  expect(actor.getSnapshot().value).toBe("Shutdown");
});

it(`emits the "riven.shutdown" event when entering the "Shutdown" state`, async ({
  actor,
}) => {
  actor.on("*", (event) => {
    expect(event.type).toBe("riven.exited");
  });

  actor.send({ type: "EXIT" });

  await waitFor(actor, (snapshot) => snapshot.matches("Exited"));

  expect.assertions(1);
});
