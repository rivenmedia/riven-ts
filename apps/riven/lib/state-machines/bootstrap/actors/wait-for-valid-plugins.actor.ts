import { fromPromise, waitFor } from "xstate";

import type { RegisteredPlugin } from "./register-plugins.actor.ts";

export const waitForValidPlugins = fromPromise<
  undefined,
  Map<symbol, RegisteredPlugin>
>(async ({ input }) => {
  await Promise.allSettled(
    Array.from(input.values()).map(async ({ ref }) => {
      ref.send({ type: "riven:validate-plugin" });

      return waitFor(ref, (state) => state.matches("Validated"));
    }),
  );
});
