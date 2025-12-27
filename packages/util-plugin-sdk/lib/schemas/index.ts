import { z } from "zod";

export const RivenPluginConfig = z.readonly(
  z.object({
    name: z.symbol(),
  }),
);

export type RivenPluginConfig = z.infer<typeof RivenPluginConfig>;

export const SubscribableProgramEvent = z.enum([
  "riven.running",
  "riven.exited",
]);

export type SubscribableProgramEvent = z.infer<typeof SubscribableProgramEvent>;

export const RivenPlugin = z.object({
  name: z.symbol(),
  resolvers: z.array(z.instanceof(Function)).min(1),
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
