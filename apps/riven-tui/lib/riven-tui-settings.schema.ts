import z from "zod";

export const RivenTuiSettingsSchema = z.object({
  RIVEN_TUI_SETTING__graphqlUrl: z
    .url()
    .prefault("http://localhost:3000/graphql"),
  RIVEN_TUI_SETTING__enableDebug: z.stringbool().prefault("false"),
});
