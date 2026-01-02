import { expect, it, vi } from "vitest";
import { createActor, fromPromise, toPromise } from "xstate";

import { registerPlugins } from "./register-plugins.actor.ts";

it("returns a plugin machine", async () => {
  const mockRunner = fromPromise(vi.fn());
  const mockValidator = fromPromise(vi.fn());

  vi.doMock("@repo/plugin-test", async (importOriginal) => {
    const importOriginalModule =
      await importOriginal<typeof import("@repo/plugin-test")>();

    return {
      default: {
        ...importOriginalModule.default,
        runner: mockRunner,
        validator: mockValidator,
      },
    };
  });

  const actor = createActor(registerPlugins, {
    input: {
      cache: {} as never,
    },
  });

  actor.start();

  const output = await toPromise(actor);

  const registeredPlugin = output.get(Symbol.for("Plugin: Test"));

  expect(registeredPlugin?.machine.implementations.actors["pluginRunner"]).toBe(
    mockRunner,
  );

  expect(
    registeredPlugin?.machine.implementations.actors["validatePlugin"],
  ).toBe(mockValidator);
});
