import { it } from "./helpers/test-context.ts";
import { expect } from "vitest";

it('transitions to "Exited" state on EXIT event', ({ actor }) => {
  actor.send({ type: "EXIT" });

  expect(actor.getSnapshot().value).toBe("Exited");
});
