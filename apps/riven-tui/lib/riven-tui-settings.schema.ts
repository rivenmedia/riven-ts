import z from "zod";

export const RivenTuiSettingsSchema = z.object({
  RIVEN_TUI_SETTING__graphqlUrl: z
    .url()
    .prefault("http://localhost:3000/graphql"),
  // An empty value means no key, as it does for the Riven instance's own `RIVEN_SETTING__apiKey`
  RIVEN_TUI_SETTING__apiKey: z
    .string()
    .optional()
    .transform((apiKey) => (apiKey === "" ? undefined : apiKey)),
  RIVEN_TUI_SETTING__enableDebug: z.stringbool().prefault("false"),
});
