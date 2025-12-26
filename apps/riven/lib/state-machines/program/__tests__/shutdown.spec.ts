import { it } from "./helpers/test-context.ts";
import { SubscribableProgramEvent } from "@repo/util-plugin-sdk";
import { waitFor } from "xstate";
import { expect } from "vitest";

it('transitions to "Exited" state on EXIT event', ({ actor }) => {
  actor.send({ type: "EXIT" });

  expect(actor.getSnapshot().value).toBe("Exited");
});

it(`emits the "${SubscribableProgramEvent.enum["riven.exited"]}" event when entering the "Exited" state`, async ({
  actor,
}) => {
  actor.send({ type: "EXIT" });

  await waitFor(actor, (snapshot) => snapshot.matches("Exited"));

  actor.on(SubscribableProgramEvent.enum["riven.exited"], () => {
    expect(true).toBe(true);
  });
});
