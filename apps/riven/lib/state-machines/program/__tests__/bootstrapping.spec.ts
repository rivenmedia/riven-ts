import { expect, vi } from "vitest";
import type { ActorRefFrom } from "xstate";

import type { BootstrapMachineOutput } from "../../bootstrap/index.ts";
import type { rivenMachine } from "../index.ts";
import { it } from "./helpers/test-context.ts";

function sendBootstrapDoneEvent(
  actor: ActorRefFrom<typeof rivenMachine>,
  output?: BootstrapMachineOutput,
) {
  actor.send({
    // @ts-expect-error Internal XState event
    type: "xstate.done.actor.bootstrap",
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

it("starts the plugin runners when bootstrapping is complete", async ({
  actor,
  bootstrapMachineOutput,
}) => {
  const testPlugin = await import("@repo/plugin-test");
  const pluginHookSpy = vi.spyOn(testPlugin.default.runner, "start");

  actor.start();

  sendBootstrapDoneEvent(actor, bootstrapMachineOutput);

  expect(pluginHookSpy).toHaveBeenCalledOnce();
});
