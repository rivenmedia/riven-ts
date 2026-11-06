import z from "zod";

export const SubdlSettings = z
  .object({
    apiKey: z
      .string()
      .min(1, "Subdl API Key is required")
      .describe("Your Subdl API Key")
      .meta({ secret: true }),
    languages: z
      .array(z.string().min(1))
      .describe("List of languages to download")
      .default(["en"]),
  })
  .meta({ title: "SubDL" });

export type SubdlSettings = z.infer<typeof SubdlSettings>;
