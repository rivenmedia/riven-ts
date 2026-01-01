import { it } from "./helpers/test-context.ts";
import { waitFor } from "xstate";
import { expect } from "vitest";

it('transitions to "Shutdown" then "Exited" when shutting down', async ({
  actor,
}) => {
  actor.send({ type: "EXIT" });

  expect(actor.getSnapshot().value).toBe("Shutdown");

  await waitFor(actor, (snapshot) => snapshot.matches("Exited"));

  expect(actor.getSnapshot().value).toBe("Exited");
});

it(`emits the "riven.shutdown" and "riven.exited" events when shutting down`, async ({
  actor,
}) => {
  actor.on("riven.shutdown", (event) => {
    expect(event.type).toBe("riven.shutdown");
  });

  actor.on("riven.exited", (event) => {
    expect(event.type).toBe("riven.exited");
  });

  actor.send({ type: "EXIT" });

  await waitFor(actor, (snapshot) => snapshot.matches("Exited"));

  expect.assertions(2);
});
