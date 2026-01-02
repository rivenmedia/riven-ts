import { it as baseIt } from "@repo/core-util-vitest-test-context";
import { type Actor, createActor, createEmptyActor } from "xstate";
import {
  rateLimitedFetchMachine,
  type RateLimitedFetchMachineInput,
} from "../../machines/fetch-machine.ts";
import { z, type ZodType } from "zod";

export const it = baseIt.extend<{
  actor: Actor<typeof rateLimitedFetchMachine>;
  schema: ZodType;
  validData: Record<string, unknown>;
  input: RateLimitedFetchMachineInput;
  machine: typeof rateLimitedFetchMachine;
}>({
  machine: rateLimitedFetchMachine,
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
    requestId: crypto.randomUUID(),
    fetchOpts: {},
    limiter: null,
    parentRef: createEmptyActor() as never,
    url: "https://placeholder.com",
  },
  actor: async ({ input, machine }, use) => {
    const actor = createActor(machine, { input });

    actor.start();

    await use(actor);

    actor.stop();
  },
});
