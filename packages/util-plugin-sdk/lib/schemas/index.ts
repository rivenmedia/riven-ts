import { z } from "zod";

export const RivenPluginConfig = z.readonly(
  z.object({
    name: z.symbol(),
  }),
);

export type RivenPluginConfig = z.infer<typeof RivenPluginConfig>;

export const RivenPlugin = z.object({
  name: z.symbol(),
  resolvers: z.array(z.instanceof(Function)).min(1),
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
