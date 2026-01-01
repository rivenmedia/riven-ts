/* eslint-disable @typescript-eslint/require-await */
import { it as baseIt } from "@repo/core-util-vitest-test-context";

import { type Actor, createActor } from "xstate";
import {
  createRateLimitedFetchMachine,
  type RateLimitedFetchMachineInput,
} from "../../index.ts";
import { z, type ZodType } from "zod";

export const it = baseIt.extend<{
  actor: Actor<ReturnType<typeof createRateLimitedFetchMachine>>;
  schema: ZodType;
  validData: Record<string, unknown>;
  input: RateLimitedFetchMachineInput;
  machine: ReturnType<typeof createRateLimitedFetchMachine>;
}>({
  machine: ({ schema }, use) => use(createRateLimitedFetchMachine(schema)),
  schema: z.object({
    userId: z.number(),
    id: z.number(),
    title: z.string(),
    completed: z.boolean(),
  }),
  validData: {
    userId: 1,
    id: 1,
    title: "delectus aut autem",
    completed: false,
  },
  input: {
    url: "https://placeholder.com",
  },
  actor: async ({ input, machine }, use) => {
    const actor = createActor(machine, { input });

    actor.start();

    await use(actor);

    actor.stop();
  },
});
