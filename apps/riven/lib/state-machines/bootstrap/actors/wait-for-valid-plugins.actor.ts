import { fromPromise, toPromise } from "xstate";

import type { RegisteredPlugin } from "./register-plugins.actor.ts";

export const waitForValidPlugins = fromPromise<
  symbol[],
  Map<symbol, RegisteredPlugin>
>(async ({ input }) => {
  const plugins = await Promise.allSettled(
    Array.from(input.values()).map(async ({ ref }) => {
      if (!ref) {
        return;
      }

      ref.send({ type: "riven.validate-plugin" });

      return toPromise(ref);
    }),
  );

  return plugins.reduce<symbol[]>((acc, result) => {
    if (result.status === "fulfilled" && result.value) {
      return acc.concat([result.value.plugin]);
    }

    return acc;
  }, []);
});
