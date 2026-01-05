import { expect } from "vitest";

import { it } from "./helpers/test-context.ts";

import type { BootstrapMachineOutput } from "../../bootstrap/index.ts";
import type { rivenMachine } from "../index.ts";
import type { ActorRefFrom } from "xstate";

function sendBootstrapDoneEvent(
  actor: ActorRefFrom<typeof rivenMachine>,
  output?: BootstrapMachineOutput,
) {
  actor.send({
    // @ts-expect-error Internal XState event
    type: "xstate.done.actor.bootstrapMachine",
    output,
  });
}

it("assigns the Apollo Server instance to context when bootstrapping is complete", ({
  actor,
  bootstrapMachineOutput,
}) => {
  actor.start();

  sendBootstrapDoneEvent(actor, bootstrapMachineOutput);

  expect(actor.getSnapshot().context.server).toBe(
    bootstrapMachineOutput.server,
  );
});

it("starts the main runner when bootstrapping is complete", ({
  actor,
  bootstrapMachineOutput,
}) => {
  actor.start();

  sendBootstrapDoneEvent(actor, bootstrapMachineOutput);

  expect(actor.getSnapshot().context.mainRunnerRef).toBeDefined();
});
