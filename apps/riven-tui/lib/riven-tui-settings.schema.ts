import z from "zod";

export const RivenTuiSettingsSchema = z.object({
  graphqlUrl: z.url().prefault("http://localhost:3000/graphql"),
});
