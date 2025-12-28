import { StateMachine, type AnyStateMachine } from "xstate";
import { z } from "zod";

export const RivenPluginConfig = z.readonly(
  z.object({
    name: z.symbol(),
  }),
);

export type RivenPluginConfig = z.infer<typeof RivenPluginConfig>;

export const requestedItemSchema = z.object({
  imdbId: z.string().optional(),
  tmdbId: z.string().optional(),
  tvdbId: z.string().optional(),
});

export type RequestedItem = z.infer<typeof requestedItemSchema>;

export const SubscribableProgramEvent = z.enum([
  "riven.running",
  "riven.exited",
]);

export type SubscribableProgramEvent = z.infer<typeof SubscribableProgramEvent>;

export type PublishableProgramEvent = {
  type: "media:requested";
  data: RequestedItem[];
};

export const RivenPlugin = z.object({
  name: z.symbol(),
  resolvers: z.array(z.instanceof(Function)).min(1),
  stateMachine: z.custom<AnyStateMachine>(
    (value) => value instanceof StateMachine,
  ),
  events: z
    .partialRecord(
      SubscribableProgramEvent,
      z.function({
        input: [z.any()],
        output: z.void(),
      }),
    )
    .optional(),
  context: z
    .function({
      input: [
        z.object({
          // TODO: Replace z.any with a more specific type for KeyValueCache
          cache: z.any(),
        }),
      ],
    })
    .optional(),
});

export type RivenPlugin = z.infer<typeof RivenPlugin>;

export const isRivenPluginPackage = (
  obj: unknown,
): obj is { default: RivenPlugin } => {
  if (typeof obj !== "object" || obj === null) {
    return false;
  }

  const maybePlugin = (obj as { default?: unknown }).default;

  return RivenPlugin.safeParse(maybePlugin).success;
};
